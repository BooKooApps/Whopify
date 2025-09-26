import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { createWhopClient } from "../sdk/whop";

export async function getServerWhopClient(req: NextApiRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const bearer = typeof token?.accessToken === "string" ? token.accessToken : undefined;
  const baseUrl = process.env.NEXT_PUBLIC_WHOP_API_BASE_URL || undefined;
  return createWhopClient({ token: bearer, baseUrl });
}


