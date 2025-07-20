import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { cache } from "hono/cache";
import { extname } from "@std/path";

import auth from "./auth.ts";
import games from "./games.ts";
import { env } from "hono/adapter";

const root = "./dist/client";

const app = new Hono();
app.use(logger());
app.use(compress());
app.route("/", auth);
app.route("/", games);
app.get(
  "*",
  cache({
    cacheName: (c) => "static-" + env(c).DENO_DEPLOYMENT_ID,
    cacheControl: "max-age=86400, public",
    wait: true,
  }),
  serveStatic({
    root,
    rewriteRequestPath: (path) => {
      if ([".html", ".js", ".css"].includes(extname(path))) return path;
      return "/index.html";
    },
  }),
);

showRoutes(app, { verbose: true });

export default app satisfies Deno.ServeDefaultExport;
