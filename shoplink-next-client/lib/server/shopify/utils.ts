import crypto from "node:crypto";
import { storage } from "../utils/storage";
import { getEnv } from "../utils/env";

export function createState(payload?: Record<string, unknown>): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const data = { nonce, ...(payload ?? {}) };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export async function saveState(_state: string) {
  // optional strict validation later
}

export function verifyHmac(searchParams: URLSearchParams): boolean {
  const { SHOPIFY_API_SECRET } = getEnv();
  const hmac = searchParams.get("hmac") || "";
  const sorted = new URLSearchParams(
    Array.from(searchParams.entries())
      .filter(([k]) => k !== "hmac")
      .sort(([a], [b]) => (a > b ? 1 : -1))
  ).toString();
  const digest = crypto.createHmac("sha256", SHOPIFY_API_SECRET).update(sorted).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac, "utf8"), Buffer.from(digest, "utf8"));
}

export function buildInstallUrl({ shop, state, clientId, appBaseUrl }: { shop: string; state: string; clientId: string; appBaseUrl: string }) {
  const redirectUri = encodeURIComponent(`${appBaseUrl}/api/shopify/callback`);
  const scopes = encodeURIComponent(getEnv().SHOPIFY_SCOPES);
  return `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
}

export async function exchangeCodeForToken({ shop, code }: { shop: string; code: string }) {
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = getEnv();
  const resp = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${text}`);
  }
  return (await resp.json()) as { access_token: string; scope: string };
}

export function verifyWebhookHmac(hmacHeader: string | null | undefined, rawBody: ArrayBuffer): boolean {
  if (!hmacHeader) return false;
  const { SHOPIFY_API_SECRET } = getEnv();
  const digest = crypto.createHmac("sha256", SHOPIFY_API_SECRET).update(Buffer.from(rawBody)).digest("base64");
  const a = Buffer.from(hmacHeader, "utf8");
  const b = Buffer.from(digest, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function base64url(input: Buffer) {
  return input.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function verifyInstallAuthToken(token: string, expectedExperienceId: string): { sub: string; experienceId: string; exp: number } | null {
  try {
    const { INSTALL_SIGNING_SECRET } = getEnv();
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as { sub: string; experienceId: string; exp: number };
    const h = crypto.createHmac("sha256", INSTALL_SIGNING_SECRET).update(payloadB64).digest();
    const expectedSig = base64url(h);
    const a = Buffer.from(sigB64, "utf8");
    const b = Buffer.from(expectedSig, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    if (payload.experienceId !== expectedExperienceId) return null;
    if (typeof payload.exp !== "number" || Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}


