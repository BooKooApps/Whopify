import crypto from "node:crypto";
import { storage } from "../utils/storage.js";
import { getEnv } from "../utils/env.js";

export function createState(payload?: Record<string, unknown>): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const data = { nonce, ...(payload ?? {}) };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export async function saveState(_state: string) {
  // Optional: persist state if we want strict validation later.
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

export function buildInstallUrl({ shop, state, clientId, appUrl }: { shop: string; state: string; clientId: string; appUrl: string }) {
  const redirectUri = encodeURIComponent(`${appUrl}/shopify/callback`);
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


