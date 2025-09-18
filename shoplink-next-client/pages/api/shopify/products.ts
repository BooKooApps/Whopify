import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../lib/server/utils/storage";
import { fetchProductsAdmin } from "../../../lib/server/shopify/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { experienceId, first } = req.query as {
    experienceId?: string;
    first?: string;
  };

  if (!experienceId) {
    return res.status(400).json({ error: "Missing experienceId" });
  }

  try {
    const rec = await storage.getShopByExperience(experienceId);
    if (!rec?.adminAccessToken) {
      return res.status(404).json({ error: "Not connected" });
    }

    const firstNum = first ? parseInt(first, 10) : 20;
    const items = await fetchProductsAdmin({ 
      shop: rec.shopDomain, 
      adminAccessToken: rec.adminAccessToken, 
      first: firstNum 
    });

    return res.json({ 
      shopDomain: rec.shopDomain, 
      products: items 
    });
  } catch (error: any) {
    console.error("Products fetch error:", error);
    return res.status(502).json({ error: error.message || "Failed to fetch products" });
  }
}
