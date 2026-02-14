import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { lag } from "./routes/lag";
import type { Env } from "./db.js";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: (origin, ctx: Context<{ Bindings: Env }>) => {
      const allowedOrigins = ctx.env.CORS_ORIGINS.split(",");
      if (allowedOrigins.includes(origin || "")) {
        return origin;
      }
      return "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    maxAge: 24 * 60 * 60, // 1 day
  }),
);

app.route("/lag", lag);

app.get("/health", (c) => c.text("OK"));

export default app;
