import type { NextApiRequest, NextApiResponse } from "next";
import { getEnv } from "../../../lib/server/utils/env";
import { createState, saveState, buildInstallUrl } from "../../../lib/server/shopify/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shop, experienceId, auth, returnUrl } = req.query as { 
    shop?: string; 
    experienceId?: string; 
    auth?: string; 
    returnUrl?: string; 
  };

  if (!shop || !experienceId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const { SHOPIFY_API_KEY } = getEnv();
    const state = createState({ experienceId, returnUrl });
    await saveState(state);

    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    const host = req.headers.host || "localhost";
    const origin = `${proto}://${host}`.replace("http://127.0.0.1:", "http://localhost:");
    
    const installUrl = buildInstallUrl({ 
      shop, 
      state, 
      clientId: SHOPIFY_API_KEY, 
      appBaseUrl: origin 
    });

    return res.redirect(installUrl);
  } catch (error: any) {
    console.error("Install error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}