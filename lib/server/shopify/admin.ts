import { getEnv } from "../utils/env";

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
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Shopify Admin GraphQL HTTP ${resp.status}: ${text || resp.statusText}`);
  }
  const json = (await resp.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length) {
    throw new Error(`Shopify Admin GraphQL errors: ${json.errors.map(e => e.message).join("; ")}`);
  }
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

export async function registerAppUninstalledWebhook({ shop, adminAccessToken, callbackUrl }: { shop: string; adminAccessToken: string; callbackUrl: string; }) {
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
      callbackUrl,
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
  if (!payload) throw new Error("webhookSubscriptionCreate error: no payload");
  if (payload.userErrors?.length) {
    const duplicate = payload.userErrors.some((e) => (e.message || "").toLowerCase().includes("address for this topic has already been taken"));
    if (duplicate) return payload.webhookSubscription?.id ?? null;
    throw new Error(`webhookSubscriptionCreate error: ${payload.userErrors.map(e => e.message).join(", ")}`);
  }
  return payload.webhookSubscription?.id ?? null;
}

async function storefrontGraphQL<T>({ shop, storefrontAccessToken, query, variables }: { shop: string; storefrontAccessToken: string; query: string; variables?: Record<string, unknown>; }): Promise<GraphQLResponse<T>> {
  const resp = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Shopify Storefront GraphQL HTTP ${resp.status}: ${text || resp.statusText}`);
  }
  const json = (await resp.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length) {
    throw new Error(`Shopify Storefront GraphQL errors: ${json.errors.map(e => e.message).join("; ")}`);
  }
  return json;
}

export async function fetchProductsAdmin({ shop, adminAccessToken, first = 20 }: { shop: string; adminAccessToken: string; first?: number }) {
  const query = /* GraphQL */ `
    query Products($first: Int!) {
      products(first: $first, sortKey: TITLE) {
        nodes {
          id
          title
          handle
          featuredImage { url }
          variants(first: 1) { nodes { id price } }
        }
      }
    }
  `;
  const res = await adminGraphQL<{
    products: { nodes: Array<{ id: string; title: string; handle: string; featuredImage?: { url: string } | null; variants: { nodes: Array<{ id: string; price: string }> } }> };
  }>({ shop, adminAccessToken, query, variables: { first } });
  const nodes = res.data?.products.nodes ?? [];
  return nodes.map((n) => ({
    id: n.id,
    title: n.title,
    handle: n.handle,
    imageUrl: n.featuredImage?.url ?? null,
    price: n.variants.nodes[0]?.price ?? null,
    variantId: n.variants.nodes[0]?.id ?? null,
  }));
}

export async function fetchShopInfo({ shop, adminAccessToken }: { shop: string; adminAccessToken: string }) {
  const query = /* GraphQL */ `
    query ShopInfo {
      shop {
        id
        name
        email
        myshopifyDomain
        currencyCode
        ianaTimezone
        plan {
          displayName
          partnerDevelopment
          shopifyPlus
        }
        primaryDomain {
          host
          sslEnabled
          url
        }
        billingAddress {
          address1
          address2
          city
          province
          country
          zip
          phone
        }
        weightUnit
        unitSystem
        createdAt
        updatedAt
      }
    }
  `;
  
  const res = await adminGraphQL<{
    shop: {
      id: string;
      name: string;
      email: string;
      myshopifyDomain: string;
      currencyCode: string;
      ianaTimezone: string;
      plan: {
        displayName: string;
        partnerDevelopment: boolean;
        shopifyPlus: boolean;
      };
      primaryDomain: {
        host: string;
        sslEnabled: boolean;
        url: string;
      };
      billingAddress: {
        address1: string;
        address2: string;
        city: string;
        province: string;
        country: string;
        zip: string;
        phone: string;
      };
      weightUnit: string;
      unitSystem: string;
      createdAt: string;
      updatedAt: string;
    };
  }>({ shop, adminAccessToken, query });
  
  return res.data?.shop;
}

export async function cartCreateStorefront({ shop, storefrontAccessToken, lines }: { shop: string; storefrontAccessToken: string; lines: Array<{ variantId: string; quantity?: number }>; }): Promise<{ checkoutUrl: string; cartId: string }> {
  const mutation = /* GraphQL */ `
    mutation CartCreate($input: CartInput) {
      cartCreate(input: $input) {
        cart { id checkoutUrl }
        userErrors { message field }
      }
    }
  `;
  const variables = {
    input: {
      lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity ?? 1 })),
    },
  } as const;
  const res = await storefrontGraphQL<{ cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: Array<{ message: string }>; } }>({
    shop,
    storefrontAccessToken,
    query: mutation,
    variables,
  });
  const payload = res.data?.cartCreate;
  if (!payload) throw new Error("cartCreate error: no payload");
  if (payload.userErrors && payload.userErrors.length) {
    throw new Error(`cartCreate error: ${payload.userErrors.map(e => e.message).join(", ")}`);
  }
  if (!payload.cart?.checkoutUrl || !payload.cart?.id) {
    throw new Error("cartCreate error: missing checkoutUrl or id");
  }
  return { checkoutUrl: payload.cart.checkoutUrl, cartId: payload.cart.id };
}

export async function createDraftOrder({ shop, adminAccessToken, variantId, quantity, email, shippingAddress }: { shop: string; adminAccessToken: string; variantId: string; quantity: number; email?: string; shippingAddress?: { firstName?: string; lastName?: string; address1?: string; city?: string; province?: string; country?: string; zip?: string; }; }): Promise<{ orderId: string; orderName: string }> {
  const mutation = /* GraphQL */ `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const input: any = {
    lineItems: [
      {
        variantId,
        quantity
      }
    ]
  };
  
  if (email) {
    input.email = email;
  }
  
  if (shippingAddress) {
    input.shippingAddress = shippingAddress;
  }
  
  const res = await adminGraphQL<{
    draftOrderCreate: {
      draftOrder: { id: string; name: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    }
  }>({ shop, adminAccessToken, query: mutation, variables: { input } });
  
  const payload = res.data?.draftOrderCreate;
  if (!payload) throw new Error("draftOrderCreate error: no payload");
  if (payload.userErrors && payload.userErrors.length) {
    throw new Error(`draftOrderCreate error: ${payload.userErrors.map(e => e.message).join(", ")}`);
  }
  if (!payload.draftOrder) {
    throw new Error("draftOrderCreate error: no draft order returned");
  }
  
  return { orderId: payload.draftOrder.id, orderName: payload.draftOrder.name };
}

export async function completeDraftOrder({ shop, adminAccessToken, draftOrderId }: { shop: string; adminAccessToken: string; draftOrderId: string; }): Promise<{ orderId: string; orderName: string }> {
  const mutation = /* GraphQL */ `
    mutation DraftOrderComplete($id: ID!) {
      draftOrderComplete(id: $id) {
        draftOrder {
          order {
            id
            name
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const res = await adminGraphQL<{
    draftOrderComplete: {
      draftOrder: { order: { id: string; name: string } | null } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    }
  }>({ shop, adminAccessToken, query: mutation, variables: { id: draftOrderId } });
  
  const payload = res.data?.draftOrderComplete;
  if (!payload) throw new Error("draftOrderComplete error: no payload");
  if (payload.userErrors && payload.userErrors.length) {
    throw new Error(`draftOrderComplete error: ${payload.userErrors.map(e => e.message).join(", ")}`);
  }
  if (!payload.draftOrder?.order) {
    throw new Error("draftOrderComplete error: no order returned");
  }
  
  return { orderId: payload.draftOrder.order.id, orderName: payload.draftOrder.order.name };
}


