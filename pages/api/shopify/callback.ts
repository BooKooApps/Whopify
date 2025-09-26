import type { NextApiRequest, NextApiResponse } from "next";
import { verifyHmac, exchangeCodeForToken } from "../../../lib/server/shopify/utils";
import { storage } from "../../../lib/server/utils/storage";
import { createStorefrontAccessToken, registerAppUninstalledWebhook } from "../../../lib/server/shopify/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shop, code, state, hmac } = req.query as {
    shop?: string;
    code?: string;
    state?: string;
    hmac?: string;
  };

  if (!shop || !code || !state || !hmac) {
    return res.status(400).json({ error: "Invalid callback params" });
  }

  try {
    // Verify HMAC
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const searchParams = new URLSearchParams(url.search);
    const isValid = verifyHmac(searchParams);
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid HMAC" });
    }

    // Exchange code for token
    const token = await exchangeCodeForToken({ shop, code });
    await storage.saveShop({ 
      shopDomain: shop, 
      adminAccessToken: token.access_token 
    });

    // Create storefront access token
    try {
      const sfToken = await createStorefrontAccessToken({ 
        shop, 
        adminAccessToken: token.access_token 
      });
      await storage.saveShop({ 
        shopDomain: shop, 
        adminAccessToken: token.access_token, 
        storefrontAccessToken: sfToken 
      });
    } catch (e: any) {
      console.warn("Storefront token creation failed:", e.message);
    }

    // Register webhook
    try {
      const proto = (req.headers["x-forwarded-proto"] as string) || "http";
      const host = req.headers.host || "localhost";
      const origin = `${proto}://${host}`.replace("http://127.0.0.1:", "http://localhost:");
      
      await registerAppUninstalledWebhook({ 
        shop, 
        adminAccessToken: token.access_token,
        callbackUrl: `${origin}/api/shopify/webhooks/app_uninstalled`
      });
    } catch (e: any) {
      console.warn("Webhook registration failed:", e.message);
    }

    // Parse state for return URL
    let returnUrl = "/";
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decodedState.returnUrl) {
        returnUrl = decodedState.returnUrl;
      }
      if (decodedState.experienceId) {
        await storage.saveExperienceMapping(decodedState.experienceId, shop);
      }
    } catch (e) {
      console.warn("Failed to parse state:", e);
    }

    return res.redirect(returnUrl);
  } catch (error: any) {
    console.error("Callback error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
