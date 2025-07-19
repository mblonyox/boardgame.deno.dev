import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { serveStatic } from "hono/deno";

import auth from "./auth.ts";
import games from "./games.ts";

export const app = new Hono();
app.route("/", auth);
app.route("/api/games", games);
app.use(
  "*",
  serveStatic({
    root: "./dist/client",
  }),
);

showRoutes(app, { verbose: true });

export const fetch = app.fetch;

export default { fetch } satisfies Deno.ServeDefaultExport;
