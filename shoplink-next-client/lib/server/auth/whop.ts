import crypto from "node:crypto";

type WhopTokenPayload = {
  sub: string;
  role: string;
  experiences?: string[];
  exp?: number;
};

export type WhopSessionClaims = {
  sub: string;
  role: string;
  experiences: string[];
};

function timingSafeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifyWhopSignedToken(token: string | null | undefined) {
  if (!token) return null;
  const secret = process.env.WHOP_SIGNING_SECRET;
  if (!secret) throw new Error("Missing WHOP_SIGNING_SECRET");
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const data = `${headerPart}.${payloadPart}`;
  const expected = crypto
    .createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(data)
    .digest("base64url");
  if (!timingSafeEquals(signaturePart, expected)) return null;
  let payload: WhopTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.sub || !payload.role) return null;
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
  const experiences = Array.isArray(payload.experiences) ? payload.experiences.filter((value) => typeof value === "string") : [];
  return { sub: payload.sub, role: payload.role, experiences };
}

function base64urlEncode(input: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

export function createSessionJwt(claims: WhopSessionClaims, options?: { maxAgeSeconds?: number }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing NEXTAUTH_SECRET");
  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = options?.maxAgeSeconds ?? 60 * 60 * 6;
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: claims.sub,
    role: claims.role,
    experiences: claims.experiences,
    iat: nowSeconds,
    exp: nowSeconds + maxAge,
  };
  const headerPart = base64urlEncode(header);
  const payloadPart = base64urlEncode(payload);
  const signature = crypto
    .createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(`${headerPart}.${payloadPart}`)
    .digest("base64url");
  return `${headerPart}.${payloadPart}.${signature}`;
}

export function buildSessionCookie(token: string, options?: { secure?: boolean; maxAgeSeconds?: number }) {
  const maxAge = options?.maxAgeSeconds ?? 60 * 60 * 6;
  const parts = [
    `next-auth.session-token=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (options?.secure) parts.push("Secure");
  return parts.join("; ");
}


