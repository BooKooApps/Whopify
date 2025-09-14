import { Hono } from "hono";
import { z } from "zod";
import { getEnv } from "../utils/env.js";
import { createState, saveState, verifyHmac, buildInstallUrl, exchangeCodeForToken, verifyWebhookHmac } from "./utils.js";
import { storage } from "../utils/storage.js";
import { createStorefrontAccessToken, registerAppUninstalledWebhook, fetchProductsAdmin } from "./admin.js";
import { createLogger } from "../utils/logger.js";

export const shopifyRouter = new Hono<{ Variables: { requestId: string } }>();

shopifyRouter.get("/install", async (c) => {
  const query = z
    .object({ shop: z.string().min(1), experienceId: z.string().min(1) })
    .safeParse(Object.fromEntries(new URL(c.req.url).searchParams));

  if (!query.success) {
    return c.json({ error: "Missing shop parameter" }, 400);
  }

  const { SHOPIFY_API_KEY, APP_URL } = getEnv();
  const state = createState({ experienceId: query.data.experienceId });
  await saveState(state);

  const installUrl = buildInstallUrl({ shop: query.data.shop, state, clientId: SHOPIFY_API_KEY, appUrl: APP_URL });
  const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
  logger.info("oauth_install_start", { shop: query.data.shop, experienceId: query.data.experienceId });
  return c.redirect(installUrl, 302);
});

shopifyRouter.get("/callback", async (c) => {
  const url = new URL(c.req.url);
  const params = Object.fromEntries(url.searchParams);

  const schema = z.object({ shop: z.string(), code: z.string(), state: z.string(), hmac: z.string() });
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return c.json({ error: "Invalid callback params" }, 400);
  }

  const isValid = verifyHmac(url.searchParams);
  if (!isValid) {
    const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
    logger.warn("oauth_callback_invalid_hmac", { shop: params["shop"] });
    return c.json({ error: "Invalid HMAC" }, 401);
  }

  const { shop, code } = parsed.data;
  const decodedState = JSON.parse(Buffer.from(parsed.data.state, "base64url").toString("utf8")) as { experienceId?: string };
  const token = await exchangeCodeForToken({ shop, code });

  await storage.saveShop({ shopDomain: shop, adminAccessToken: token.access_token });

  // Storefront token creation not required for Admin-based product listing
  await storage.saveShop({ shopDomain: shop, adminAccessToken: token.access_token });

  await registerAppUninstalledWebhook({ shop, adminAccessToken: token.access_token });

  if (decodedState.experienceId) {
    await storage.saveExperienceMapping(decodedState.experienceId, shop);
  }

  const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
  logger.info("oauth_install_success", { shop, experienceId: decodedState.experienceId });
  return c.json({ ok: true, shop });
});

shopifyRouter.get("/storefront-config", async (c) => {
  const query = z
    .object({ experienceId: z.string().min(1) })
    .safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!query.success) return c.json({ error: "Missing experienceId" }, 400);
  const shop = await storage.getShopByExperience(query.data.experienceId);
  if (!shop || !shop.storefrontAccessToken) return c.json({ error: "Not connected" }, 404);
  const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
  logger.debug("storefront_config_served", { experienceId: query.data.experienceId, shopDomain: shop.shopDomain });
  return c.json({ shopDomain: shop.shopDomain, storefrontAccessToken: shop.storefrontAccessToken });
});

// Admin API: products for this experience
shopifyRouter.get("/products", async (c) => {
  const query = z
    .object({ experienceId: z.string().min(1), first: z.string().optional() })
    .safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!query.success) return c.json({ error: "Missing experienceId" }, 400);
  const rec = await storage.getShopByExperience(query.data.experienceId);
  if (!rec?.adminAccessToken) return c.json({ error: "Not connected" }, 404);
  const first = query.data.first ? parseInt(query.data.first, 10) : 20;
  const items = await fetchProductsAdmin({ shop: rec.shopDomain, adminAccessToken: rec.adminAccessToken, first });
  return c.json({ products: items });
});

shopifyRouter.post("/webhooks/app_uninstalled", async (c) => {
  const hmac = c.req.header("x-shopify-hmac-sha256");
  const raw = await c.req.arrayBuffer();
  if (!verifyWebhookHmac(hmac, raw)) {
    const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
    logger.warn("webhook_invalid_hmac");
    return c.text("invalid hmac", 401);
  }
  const shop = c.req.header("x-shopify-shop-domain");
  if (shop) {
    await storage.saveShop({ shopDomain: shop, adminAccessToken: "" });
  }
  const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
  logger.info("webhook_app_uninstalled", { shop });
  return c.text("ok");
});

// Dev utilities for Postman testing
shopifyRouter.post("/dev/save-shop", async (c) => {
  const body = await c.req.json().catch(() => null) as any;
  if (!body || typeof body.shopDomain !== "string") return c.json({ error: "shopDomain required" }, 400);
  await storage.saveShop({ shopDomain: body.shopDomain, adminAccessToken: body.adminAccessToken ?? "", storefrontAccessToken: body.storefrontAccessToken ?? undefined });
  if (body.experienceId) await storage.saveExperienceMapping(body.experienceId, body.shopDomain);
  return c.json({ ok: true });
});

shopifyRouter.get("/dev/load-shop", async (c) => {
  const q = new URL(c.req.url).searchParams;
  const shop = q.get("shopDomain");
  const experienceId = q.get("experienceId");
  if (shop) {
    const rec = await storage.getShop(shop);
    return c.json(rec ?? null);
  }
  if (experienceId) {
    const rec = await storage.getShopByExperience(experienceId);
    return c.json(rec ?? null);
  }
  return c.json({ error: "provide shopDomain or experienceId" }, 400);
});


