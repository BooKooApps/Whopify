import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../../lib/server/utils/storage";
import { createStorefrontAccessToken, cartCreateStorefront } from "../../../../lib/server/shopify/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { experienceId, lines } = req.body as {
    experienceId?: string;
    lines?: Array<{ variantId: string; quantity?: number }>;
  };

  if (!experienceId || !lines || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: "Invalid body" });
  }

  try {
    const rec = await storage.getShopByExperience(experienceId);
    if (!rec?.shopDomain) {
      return res.status(404).json({ error: "Not connected" });
    }

    if (!rec.storefrontAccessToken) {
      if (!rec.adminAccessToken) {
        return res.status(404).json({ error: "Not connected" });
      }
      
      try {
        const sf = await createStorefrontAccessToken({ 
          shop: rec.shopDomain, 
          adminAccessToken: rec.adminAccessToken 
        });
        await storage.saveShop({ 
          shopDomain: rec.shopDomain, 
          adminAccessToken: rec.adminAccessToken, 
          storefrontAccessToken: sf 
        });
        rec.storefrontAccessToken = sf;
      } catch (e: any) {
        console.error("Storefront token backfill failed:", e);
        return res.status(502).json({ error: e.message || "Failed to create storefront token" });
      }
    }

    const result = await cartCreateStorefront({ 
      shop: rec.shopDomain, 
      storefrontAccessToken: rec.storefrontAccessToken, 
      lines 
    });

    return res.json({ 
      checkoutUrl: result.checkoutUrl, 
      cartId: result.cartId 
    });
  } catch (error: any) {
    console.error("Cart create error:", error);
    return res.status(502).json({ error: error.message || "Failed to create cart" });
  }
}
