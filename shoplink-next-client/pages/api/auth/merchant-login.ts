import type { NextApiRequest, NextApiResponse } from "next";
import { verifyWhopSignedToken, createSessionJwt, buildSessionCookie } from "../../../lib/server/auth/whop";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body as { token?: string };
  const claims = verifyWhopSignedToken(token);
  if (!claims) {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (claims.role !== "merchant") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const sessionToken = createSessionJwt({
    sub: claims.sub,
    role: claims.role,
    experiences: claims.experiences,
  });

  const secure = process.env.NODE_ENV === "production";
  const cookie = buildSessionCookie(sessionToken, { secure });
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok: true });
}


