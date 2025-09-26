import type { NextApiRequest, NextApiResponse } from "next";
import { storage } from "../../../lib/server/utils/storage";
import { fetchShopInfo } from "../../../lib/server/shopify/admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { experienceId } = req.query as {
    experienceId?: string;
  };

  if (!experienceId) {
    return res.status(400).json({ error: "Missing experienceId" });
  }

  try {
    const rec = await storage.getShopByExperience(experienceId);
    if (!rec?.adminAccessToken) {
      return res.status(404).json({ error: "Not connected" });
    }

    const shopInfo = await fetchShopInfo({ 
      shop: rec.shopDomain, 
      adminAccessToken: rec.adminAccessToken 
    });

    if (!shopInfo) {
      return res.status(404).json({ error: "Shop information not found" });
    }

    return res.json({ 
      shopDomain: rec.shopDomain, 
      shopInfo 
    });
  } catch (error: any) {
    console.error("Shop info fetch error:", error);
    return res.status(502).json({ error: error.message || "Failed to fetch shop information" });
  }
}
