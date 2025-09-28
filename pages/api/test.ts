import type { NextApiRequest, NextApiResponse } from "next";

function parseCookie(header: string | undefined) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(/;\s*/).forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== API TEST DEBUG ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", Object.keys(req.headers));
  console.log("Cookies:", Object.keys(parseCookie(req.headers.cookie)));
  console.log("Query:", req.query);
  console.log("Body:", req.body);
  console.log("=====================");
  
  try {
    const cookies = parseCookie(req.headers.cookie);
    const bearer = cookies["whop_user_token"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!bearer) return res.status(401).json({ error: "Missing whop token", debug: "No whop_user_token cookie or Authorization header found" });
    const base = process.env.WHOP_API_BASE_URL || "https://api.whop.com";
    const response = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${bearer}` } });
    const j = await response.json().catch(() => ({} as any));
    if (!response.ok) return res.status(response.status).json({ error: j?.error || "Failed /me" });
    console.log("Whop /me:", j);
    return res.status(200).json({ ok: true, me: j });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch /me" });
  }
}
