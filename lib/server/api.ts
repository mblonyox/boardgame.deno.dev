import { PluginRoute } from "$fresh/server.ts";
import { Game } from "boardgame.io";
import { Async, Sync } from "boardgame.io/internal";
import { GenericPubSub } from "boardgame.io/server";

export class API {
  constructor(
    private games: Game[],
    private db: Async | Sync,
    // deno-lint-ignore no-explicit-any
    private pubSub: GenericPubSub<any>,
  ) {}

  private jsonResponse(data?: object) {
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  routes(path = "/"): PluginRoute[] {
    return [{
      path: path + "/games",
      handler: (_req, _ctx) =>
        this.jsonResponse(this.games.map((game) => game.name)),
    }, {
      path: path + "/games/[name]/create",
      handler: {
        POST: async (req, ctx) => {
          const gameName = ctx.params.name;
          const game = this.games.find((game) => game.name === gameName);
          if (!game) return ctx.renderNotFound();
          const { setupData, unlisted, numPlayers } = await req.json();
          return this.jsonResponse();
        },
      },
    }];
  }
}
