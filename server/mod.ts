import { Hono } from "hono";
import { env } from "hono/adapter";
import { showRoutes } from "hono/dev";
import { serveStatic } from "hono/deno";
import { logger } from "hono/logger";
import { compress } from "hono/compress";
import { cache } from "hono/cache";
import { extname } from "@std/path";

import auth from "./auth.ts";
import games from "./games.ts";
import { SocketIO } from "./bgio/socket-io.ts";

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

const io = new SocketIO();

export default {
  fetch: io.handler(app),
} satisfies Deno.ServeDefaultExport;
