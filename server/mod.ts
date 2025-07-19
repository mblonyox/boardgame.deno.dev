import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { serveStatic } from "hono/deno";

import games from "./games.ts";
import auth from "./auth.ts";

export const app = new Hono();
app.route("/", auth);
app.route("/api/games", games);
app.use(
  "*",
  serveStatic({
    root: "./client/dist",
  }),
);

showRoutes(app, {verbose: true});

export const fetch = app.fetch;

export default { fetch } satisfies Deno.ServeDefaultExport;
