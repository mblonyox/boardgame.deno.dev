import type { Plugin } from "$fresh/server.ts";
import { Game } from "boardgame.io";
import { Async, Sync } from "boardgame.io/internal";
import { GenericPubSub } from "boardgame.io/server";
import { Auth, defaultAuth } from "./auth.ts";
import { API } from "./api.ts";
import { KvStorage } from "./db.ts";
import { WebSocketTransport } from "./transport.ts";
import { BroadcastChannelPubSub } from "./pubsub.ts";

type Options = {
  db?: Async | Sync;
  // deno-lint-ignore no-explicit-any
  pubSub?: GenericPubSub<any>;
  auth?: Auth;
};

export function boardgameio(games: Game[], opts?: Options): Plugin {
  const db = opts?.db ?? new KvStorage();
  const pubSub = opts?.pubSub ?? new BroadcastChannelPubSub();
  const auth = opts?.auth ?? defaultAuth;
  const api = new API(games, db, auth);
  const transport = new WebSocketTransport(games, db, pubSub, auth);

  db.connect();

  return {
    name: "boardgameio",
    routes: [...api.routes(), transport.route()],
    middlewares: [{
      path: "",
      middleware: {
        handler: (_req, ctx) => {
          ctx.state.db = db;
          ctx.state.games = games;
          return ctx.next();
        },
      },
    }],
  };
}
