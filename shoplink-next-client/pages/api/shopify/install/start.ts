import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import crypto from "node:crypto";

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shop, experienceId, returnUrl } = req.query as { shop?: string; experienceId?: string; returnUrl?: string };
  if (!shop || !experienceId) {
    return res.status(400).json({ error: "Missing shop or experienceId" });
  }

  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const allowDev = process.env.ALLOW_DEV_INSTALL_UNAUTH === "true" && process.env.NODE_ENV !== "production";
  if (!session && !allowDev) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.INSTALL_SIGNING_SECRET;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!secret || !apiBase) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const sub = (session as any)?.sub || (session as any)?.user?.id || (allowDev ? "dev-user" : "unknown");
  const payload = { sub, experienceId, exp: Math.floor(Date.now() / 1000) + 300 };
  const payloadB64 = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const token = `${payloadB64}.${base64url(sig)}`;

  const url = new URL(`${apiBase.replace(/\/$/, "")}/shopify/install`);
  url.searchParams.set("shop", shop);
  url.searchParams.set("experienceId", experienceId);
  url.searchParams.set("auth", token);
  if (returnUrl) url.searchParams.set("returnUrl", returnUrl);

  return res.status(200).json({ installUrl: url.toString() });
}


