import { Hono } from "hono";
import { z } from "zod";
import { createState, saveState, verifyHmac, buildInstallUrl, exchangeCodeForToken, verifyWebhookHmac, verifyInstallAuthToken } from "./utils";
import { postgresStorage as storage } from "../utils/postgres";
import { createStorefrontAccessToken, registerAppUninstalledWebhook, fetchProductsAdmin, cartCreateStorefront } from "./admin";
import { createLogger } from "../utils/logger";
import { getEnv } from "../utils/env";

export function buildShopifyApp() {
  const app = new Hono<{ Variables: { requestId: string; origin: string } }>();

  app.get("/install", async (c) => {
    const url = new URL(c.req.url);
    const query = z
      .object({ shop: z.string().min(1), experienceId: z.string().min(1), auth: z.string().min(1), returnUrl: z.string().optional() })
      .safeParse(Object.fromEntries(url.searchParams));
    if (!query.success) return c.json({ error: "Missing required parameters" }, 400);

    const valid = verifyInstallAuthToken(query.data.auth, query.data.experienceId);
    if (!valid) {
      const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
      logger.warn("install_unauthorized", { shop: query.data.shop, experienceId: query.data.experienceId });
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { SHOPIFY_API_KEY } = getEnv();
    const state = createState({ experienceId: query.data.experienceId, returnUrl: query.data.returnUrl });
    await saveState(state);

    const origin = c.get("origin");
    const installUrl = buildInstallUrl({ shop: query.data.shop, state, clientId: SHOPIFY_API_KEY, appBaseUrl: origin });
    const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
    logger.info("oauth_install_start", { shop: query.data.shop, experienceId: query.data.experienceId, sub: valid.sub });
    return c.redirect(installUrl, 302);
  });

  app.get("/callback", async (c) => {
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);
    const schema = z.object({ shop: z.string(), code: z.string(), state: z.string(), hmac: z.string() });
    const parsed = schema.safeParse(params);
    if (!parsed.success) return c.json({ error: "Invalid callback params" }, 400);

    const isValid = verifyHmac(url.searchParams);
    if (!isValid) {
      const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
      logger.warn("oauth_callback_invalid_hmac", { shop: params["shop"] });
      return c.json({ error: "Invalid HMAC" }, 401);
    }

    const { shop, code } = parsed.data;
    const decodedState = JSON.parse(Buffer.from(parsed.data.state, "base64url").toString("utf8")) as { experienceId?: string; returnUrl?: string };
    const token = await exchangeCodeForToken({ shop, code });
    await storage.saveShop({ shopDomain: shop, adminAccessToken: token.access_token });

    try {
      const sfToken = await createStorefrontAccessToken({ shop, adminAccessToken: token.access_token });
      await storage.saveShop({ shopDomain: shop, adminAccessToken: token.access_token, storefrontAccessToken: sfToken });
    } catch (e: any) {
      const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
      logger.warn("storefront_token_create_failed", { error: e?.message || String(e) });
    }

    const origin = c.get("origin");
    await registerAppUninstalledWebhook({ shop, adminAccessToken: token.access_token, callbackUrl: `${origin}/api/shopify/webhooks/app_uninstalled` });

    if (decodedState.experienceId) {
      await storage.saveExperienceMapping(decodedState.experienceId, shop);
    }
    const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
    logger.info("oauth_install_success", { shop, experienceId: decodedState.experienceId });

    if (decodedState.returnUrl) return c.redirect(decodedState.returnUrl, 302);
    return c.json({ ok: true, shop });
  });

  app.get("/storefront-config", async (c) => {
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

  app.get("/products", async (c) => {
    const query = z
      .object({ experienceId: z.string().min(1), first: z.string().optional() })
      .safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
    if (!query.success) return c.json({ error: "Missing experienceId" }, 400);
    const rec = await storage.getShopByExperience(query.data.experienceId);
    if (!rec?.adminAccessToken) return c.json({ error: "Not connected" }, 404);
    const first = query.data.first ? parseInt(query.data.first, 10) : 20;
    try {
      const items = await fetchProductsAdmin({ shop: rec.shopDomain, adminAccessToken: rec.adminAccessToken, first });
      return c.json({ shopDomain: rec.shopDomain, products: items });
    } catch (e: any) {
      const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
      logger.error("products_fetch_error", { error: e?.message || String(e) });
      return c.json({ error: e?.message || "Failed to fetch products" }, 502);
    }
  });

  app.post("/cart/create", async (c) => {
    const body = await c.req.json().catch(() => null) as any;
    const schema = z.object({ experienceId: z.string().min(1), lines: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive().optional() })).min(1) });
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
    const rec = await storage.getShopByExperience(parsed.data.experienceId);
    if (!rec?.shopDomain) return c.json({ error: "Not connected" }, 404);
    if (!rec.storefrontAccessToken) {
      if (!rec.adminAccessToken) return c.json({ error: "Not connected" }, 404);
      try {
        const sf = await createStorefrontAccessToken({ shop: rec.shopDomain, adminAccessToken: rec.adminAccessToken });
        await storage.saveShop({ shopDomain: rec.shopDomain, adminAccessToken: rec.adminAccessToken, storefrontAccessToken: sf });
        rec.storefrontAccessToken = sf;
      } catch (e: any) {
        const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
        logger.error("storefront_token_backfill_failed", { error: e?.message || String(e) });
        return c.json({ error: e?.message || "Failed to create storefront token" }, 502);
      }
    }
    try {
      const result = await cartCreateStorefront({ shop: rec.shopDomain, storefrontAccessToken: rec.storefrontAccessToken, lines: parsed.data.lines });
      return c.json({ checkoutUrl: result.checkoutUrl, cartId: result.cartId });
    } catch (e: any) {
      const logger = createLogger({ mod: "shopify", requestId: c.get("requestId") });
      logger.error("cart_create_error", { error: e?.message || String(e) });
      return c.json({ error: e?.message || "Failed to create cart" }, 502);
    }
  });

  app.post("/webhooks/app_uninstalled", async (c) => {
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

  // Dev utilities
  app.post("/dev/save-shop", async (c) => {
    const body = await c.req.json().catch(() => null) as any;
    if (!body || typeof body.shopDomain !== "string") return c.json({ error: "shopDomain required" }, 400);
    await storage.saveShop({ shopDomain: body.shopDomain, adminAccessToken: body.adminAccessToken ?? "", storefrontAccessToken: body.storefrontAccessToken ?? undefined });
    if (body.experienceId) await storage.saveExperienceMapping(body.experienceId, body.shopDomain);
    return c.json({ ok: true });
  });

  app.get("/dev/load-shop", async (c) => {
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

  return app;
}


