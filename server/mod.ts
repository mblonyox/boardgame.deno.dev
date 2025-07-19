import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { serveStatic } from "hono/deno";

import auth from "./auth.ts";
import games from "./games.ts";

export const app = new Hono();
app.route("/", auth);
app.route("/", games);
app.use(
  "*",
  serveStatic({
    root: "./dist/client",
    onNotFound: (_path, c) => {
      c.html(Deno.readTextFile("./dist/client/index.html"), 404);
    },
  }),
);

showRoutes(app, { verbose: true });

export const fetch = app.fetch;

export default { fetch } satisfies Deno.ServeDefaultExport;
