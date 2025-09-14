import { getEnv } from "../utils/env.js";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function adminGraphQL<T>({ shop, adminAccessToken, query, variables }: { shop: string; adminAccessToken: string; query: string; variables?: Record<string, unknown>; }): Promise<GraphQLResponse<T>> {
  const resp = await fetch(`https://${shop}/admin/api/2024-07/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await resp.json()) as GraphQLResponse<T>;
  return json;
}

export async function createStorefrontAccessToken({ shop, adminAccessToken }: { shop: string; adminAccessToken: string; }): Promise<string> {
  const mutation = /* GraphQL */ `
    mutation CreateSfToken($input: StorefrontAccessTokenInput!) {
      storefrontAccessTokenCreate(input: $input) {
        storefrontAccessToken { accessToken title }
        userErrors { message field }
      }
    }
  `;
  const title = `Whop ${new Date().toISOString()}`;
  const res = await adminGraphQL<{ storefrontAccessTokenCreate: { storefrontAccessToken: { accessToken: string; title: string } | null; userErrors: Array<{ message: string }>; } }>({
    shop,
    adminAccessToken,
    query: mutation,
    variables: { input: { title } },
  });
  const payload = res.data?.storefrontAccessTokenCreate;
  if (!payload || payload.userErrors?.length) {
    throw new Error(`storefrontAccessTokenCreate error: ${payload?.userErrors?.map(e => e.message).join(", ")}`);
  }
  if (!payload.storefrontAccessToken) throw new Error("No storefront access token returned");
  return payload.storefrontAccessToken.accessToken;
}

export async function registerAppUninstalledWebhook({ shop, adminAccessToken }: { shop: string; adminAccessToken: string; }) {
  const { APP_URL } = getEnv();
  const mutation = /* GraphQL */ `
    mutation RegisterWebhook($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
        webhookSubscription { id }
        userErrors { message field }
      }
    }
  `;
  const variables = {
    topic: "APP_UNINSTALLED",
    sub: {
      callbackUrl: `${APP_URL}/shopify/webhooks/app_uninstalled`,
      format: "JSON",
    },
  } as const;
  const res = await adminGraphQL<{ webhookSubscriptionCreate: { webhookSubscription: { id: string } | null; userErrors: Array<{ message: string }>; } }>({
    shop,
    adminAccessToken,
    query: mutation,
    variables,
  });
  const payload = res.data?.webhookSubscriptionCreate;
  if (!payload || payload.userErrors?.length) {
    throw new Error(`webhookSubscriptionCreate error: ${payload?.userErrors?.map(e => e.message).join(", ")}`);
  }
  return payload.webhookSubscription?.id ?? null;
}

export async function fetchProductsAdmin({ shop, adminAccessToken, first = 20 }: { shop: string; adminAccessToken: string; first?: number }) {
  const query = /* GraphQL */ `
    query Products($first: Int!) {
      products(first: $first, sortKey: TITLE) {
        nodes {
          id
          title
          featuredImage { url }
          variants(first: 1) { nodes { price } }
        }
      }
    }
  `;
  const res = await adminGraphQL<{
    products: { nodes: Array<{ id: string; title: string; featuredImage?: { url: string } | null; variants: { nodes: Array<{ price: { amount: string; currencyCode: string } }> } }> };
  }>({ shop, adminAccessToken, query, variables: { first } });
  const nodes = res.data?.products.nodes ?? [];
  return nodes.map((n) => ({
    id: n.id,
    title: n.title,
    imageUrl: n.featuredImage?.url ?? null,
    price: n.variants.nodes[0]?.price ?? null,
  }));
}


