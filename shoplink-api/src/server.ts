import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { shopifyRouter } from "./shopify/routes.js";
import { createLogger } from "./utils/logger.js";
import crypto from "node:crypto";

config();

const app = new Hono<{ Variables: { requestId: string } }>();
const baseLogger = createLogger();

// requestId + access log middleware
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  c.set("requestId", requestId);
  await next();
  const durationMs = Date.now() - start;
  baseLogger.info("http", {
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    durationMs,
  });
});

app.get("/health", (c) => c.json({ ok: true, requestId: c.get("requestId") }));

app.route("/shopify", shopifyRouter);

const port = Number(process.env.PORT) || 8787;
serve({
  fetch: app.fetch,
  port,
});

console.log(`[server] listening on http://localhost:${port}`);
