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

Dev tips:
- In local development, set `ALLOW_DEV_INSTALL_UNAUTH=true` (and keep `NODE_ENV != production`) to bypass session auth for the install/start route and test OAuth.
- Ensure the `INSTALL_SIGNING_SECRET` value matches between the API and the Next.js app. If they differ, `/shopify/install` will return Unauthorized.

