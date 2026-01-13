import { Hono } from "hono";
import { cors } from "hono/cors";
import { lag } from "./routes/lag";
import { dataloader } from "./routes/dataloader";

const app = new Hono();

app.use("/*", cors());

app.route("/lag", lag);
app.route("/dataloader", dataloader);

app.get("/health", (c) => c.text("OK"));

export default app;
