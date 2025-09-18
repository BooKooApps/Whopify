import type { NextApiRequest, NextApiResponse } from "next";
import { Hono } from "hono";
import crypto from "node:crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    const host = req.headers.host || "localhost";
    const origin = `${proto}://${host}`.replace("http://127.0.0.1:", "http://localhost:");

    const app = new Hono<{ Variables: { requestId: string; origin: string } }>();
    
    app.use("*", async (c, next) => {
      c.set("requestId", crypto.randomUUID());
      c.set("origin", origin);
      await next();
    });

    app.get("/shopify/install", (c) => {
      const { shop, experienceId, auth, returnUrl } = c.req.query();
      
      if (!shop || !experienceId) {
        return c.json({ error: "Missing required parameters" }, 400);
      }

      // For now, just return a simple response
      return c.json({ 
        message: "Install endpoint working",
        shop,
        experienceId,
        auth,
        returnUrl
      });
    });

    app.get("/shopify/products", (c) => {
      return c.json({ message: "Products endpoint working" });
    });

    app.post("/shopify/cart/create", (c) => {
      return c.json({ message: "Cart create endpoint working" });
    });

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) headers.set(k, v.join(","));
      else if (v !== undefined) headers.set(k, String(v));
    }

    const url = new URL(req.url || "", origin);
    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.method && ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const response = await app.fetch(request);
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };