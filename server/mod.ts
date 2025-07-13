import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import api from "./api.ts";
import auth from "./auth.ts";

export const app = new Hono();
app.route("/api", api);
app.route("/auth", auth);
app.use(
  "*",
  serveStatic({
    root: "./client/dist",
  }),
);

export const fetch = app.fetch;

export default { fetch } satisfies Deno.ServeDefaultExport;
