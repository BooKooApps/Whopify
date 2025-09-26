A mono repo that holds the infrastructure for [REDACTED]

## shoplink-api (Hono) — connector between Shopify and Whop

What it does:
- Handles Shopify OAuth install for a creator’s store.
- Maps `experienceId → shopDomain` and stores the Shopify Admin access token.
- Exposes product listing via Shopify Admin GraphQL for a given `experienceId`.
- Verifies a short‑lived signed token on `/shopify/install` so only authenticated creators can initiate install (Whop‑gated creator session).

Key endpoints:
- `GET /health` — health check
- `GET /shopify/install?shop=...&experienceId=...&auth=...&returnUrl=...` — starts OAuth (requires signed `auth`)
- `GET /shopify/callback` — Shopify OAuth callback; persists tokens and experience mapping; redirects to `returnUrl` if provided
- `GET /shopify/products?experienceId=...` — returns `{ shopDomain, products[] }` for storefront rendering
- `POST /shopify/webhooks/app_uninstalled` — cleans up when app is uninstalled

Run locally:
1) Create `shoplink-api/.env` with:
```
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_products,read_product_listings,read_themes
APP_URL=http://localhost:8787
INSTALL_SIGNING_SECRET=change-me-strong-secret
LOG_LEVEL=info
```
2) Install deps and run dev server:
```
cd shoplink-api
pnpm i
pnpm dev
```
Server listens on `http://localhost:8787`.


## shoplink-next-client (Next.js) — creator setup + customer storefront

What it does:
- Creator setup page to connect a Shopify store. The connect button calls Next.js API to mint a signed token, then opens the API `/shopify/install` URL.
- Customer storefront page (SSR) renders products for a given `experienceId` and links “Buy Now” to the creator’s Shopify PDP.

Important routes:
- Creator setup: `pages/index.tsx`
- Start install (server): `pages/api/shopify/install/start.ts`
- Storefront (customer): `pages/ssr/[experienceId].tsx`

Required env:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
NEXT_PUBLIC_WHOP_APP_ID=your_experience_id
NEXTAUTH_SECRET=dev-secret
ALLOW_DEV_INSTALL_UNAUTH=true
```

Run locally:
```
cd shoplink-next-client
pnpm i
pnpm dev
```
App listens on `http://localhost:3000`.


## Roles and how they’re enforced

Two roles:
- Merchant (creator): Can connect a Shopify store. Must be Whop‑authenticated to start install.
- Customer: Can view the storefront and click “Buy Now.” No access to connect/install.

Enforcement points:
- Frontend (Next.js):
  - The connect button calls `GET /api/shopify/install/start?shop=...&experienceId=...` which requires a Whop‑authenticated session (via NextAuth + Whop provider). If not authenticated/authorized, it returns 401/403.
  - On success, that route returns a signed install URL which is opened in a new tab.
- Backend (Hono API):
  - `GET /shopify/install` requires a short‑lived signed `auth` token (`INSTALL_SIGNING_SECRET`) that encodes `{ sub, experienceId, exp }`. Requests without a valid token are rejected (401).
  - `GET /shopify/products?experienceId=...` is public for SSR storefront rendering. The response includes `shopDomain` and product fields (`id`, `title`, `handle`, `imageUrl`, `price`).

Customer experience:
- Visit `/ssr/<experienceId>` to see the creator’s catalog. “Buy Now” opens `https://<shopDomain>/products/<handle>` on Shopify.

## Testing Both Flows

### Environment Setup
1. **Create `.env.local` in `shoplink-next-client`** with:
```
NEXTAUTH_SECRET=your-nextauth-secret
WHOP_SIGNING_SECRET=your-whop-signing-secret
INSTALL_SIGNING_SECRET=your-install-signing-secret
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_SCOPES=read_products,read_product_listings,read_themes
```

2. **Start the Next.js app**:
```bash
cd shoplink-next-client
pnpm install
pnpm dev
```
App runs on `http://localhost:3000`.

### Merchant Flow (Seller) Test

1. **Generate a Whop merchant token**:
```bash
# First, set your secret in terminal
export WHOP_SIGNING_SECRET="your-whop-signing-secret"

# Generate the token
node -e "const crypto=require('crypto');const secret=process.env.WHOP_SIGNING_SECRET;const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const payload=Buffer.from(JSON.stringify({sub:'merchant-123',role:'merchant',experiences:['exp-demo'],exp:Math.floor(Date.now()/1000)+300})).toString('base64url');const signature=crypto.createHmac('sha256',secret).update(header+'.'+payload).digest('base64url');console.log(\`\${header}.\${payload}.\${signature}\`);"
```

2. **Authenticate as merchant**:
```bash
# Replace <YOUR_TOKEN> with the token from step 1
curl -X POST http://localhost:3000/api/auth/merchant-login \
  -H "Content-Type: application/json" \
  -d '{"token": "<YOUR_TOKEN>"}' \
  -c cookies.txt \
  -v
```
Expected: 200 response with `Set-Cookie: next-auth.session-token=...`

3. **Access the dashboard**:
```bash
# Visit the dashboard with the session cookie
curl -X GET http://localhost:3000/ \
  -b cookies.txt \
  -v
```
Expected: 200 response with the merchant dashboard HTML

4. **Test merchant-only API endpoints**:
```bash
# Test shop info endpoint
curl -X GET "http://localhost:3000/api/shopify/shop?experienceId=exp-demo" \
  -b cookies.txt \
  -v

# Test products endpoint
curl -X GET "http://localhost:3000/api/shopify/products?experienceId=exp-demo" \
  -b cookies.txt \
  -v
```
Expected: 200 responses with shop/product data

5. **Test without authentication**:
```bash
# Clear cookies and try again
rm cookies.txt

# Try to access dashboard without auth
curl -X GET http://localhost:3000/ \
  -v
```
Expected: 302 redirect to `/unauthorized`

6. **Test API endpoints without auth**:
```bash
# Try shop endpoint without auth
curl -X GET "http://localhost:3000/api/shopify/shop?experienceId=exp-demo" \
  -v

# Try products endpoint without auth
curl -X GET "http://localhost:3000/api/shopify/products?experienceId=exp-demo" \
  -v
```
Expected: 401/403 responses

### Customer Flow (Buyer) Test

1. **Seed shop data**:
```bash
# Create test shop data
mkdir -p shoplink-next-client/lib/server/data

# Create shops.json with test shop
cat > shoplink-next-client/lib/server/data/shops.json << 'EOF'
{
  "test-shop.myshopify.com": {
    "shopDomain": "test-shop.myshopify.com",
    "adminAccessToken": "fake-admin-token",
    "storefrontAccessToken": "fake-storefront-token",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
EOF

# Create experience mapping
cat > shoplink-next-client/lib/server/data/experience-mapping.json << 'EOF'
{
  "exp-demo": "test-shop.myshopify.com"
}
EOF
```

2. **Generate customer entitlement token**:
```bash
# Generate customer token
node -e "const crypto=require('crypto');const secret=process.env.WHOP_SIGNING_SECRET;const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const payload=Buffer.from(JSON.stringify({sub:'customer-abc',role:'customer',experiences:['exp-demo'],exp:Math.floor(Date.now()/1000)+300})).toString('base64url');const signature=crypto.createHmac('sha256',secret).update(header+'.'+payload).digest('base64url');console.log(\`\${header}.\${payload}.\${signature}\`);"
```

3. **Access storefront with customer token**:
```bash
# Replace <CUSTOMER_TOKEN> with the token from step 2
curl -X GET http://localhost:3000/ssr/exp-demo \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -v
```
Expected: 200 response with storefront HTML

4. **Test without customer token**:
```bash
# Try to access storefront without token
curl -X GET http://localhost:3000/ssr/exp-demo \
  -v
```
Expected: 401/403 response

5. **Test with wrong experience ID**:
```bash
# Try to access different experience
curl -X GET http://localhost:3000/ssr/exp-other \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -v
```
Expected: 401/403 response

6. **Test customer token without experience**:
```bash
# Generate token without exp-demo in experiences
node -e "const crypto=require('crypto');const secret=process.env.WHOP_SIGNING_SECRET;const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const payload=Buffer.from(JSON.stringify({sub:'customer-abc',role:'customer',experiences:['exp-other'],exp:Math.floor(Date.now()/1000)+300})).toString('base64url');const signature=crypto.createHmac('sha256',secret).update(header+'.'+payload).digest('base64url');console.log(\`\${header}.\${payload}.\${signature}\`);"

# Try to access exp-demo with wrong token
curl -X GET http://localhost:3000/ssr/exp-demo \
  -H "Authorization: Bearer <WRONG_TOKEN>" \
  -v
```
Expected: 401/403 response

Dev tips:
- In local development, set `ALLOW_DEV_INSTALL_UNAUTH=true` (and keep `NODE_ENV != production`) to bypass session auth for the install/start route and test OAuth.
- Ensure the `INSTALL_SIGNING_SECRET` value matches between the API and the Next.js app. If they differ, `/shopify/install` will return Unauthorized.

