import { defineRoute } from "$fresh/server.ts";
import { Game } from "boardgame.io";
import { Async, Sync } from "boardgame.io/internal";
import MatchClient from "~/islands/MatchClient.tsx";

type ContextState = {
  db: Async | Sync;
  games: Game[];
};

const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

export default defineRoute<ContextState>(
  async (_req, ctx) => {
    const gameName = ctx.params.game;
    const matchID = ctx.params.match;
    const { metadata } = await ctx.state.db.fetch(matchID, { metadata: true });
    const game = ctx.state.games.find((game) => game.name === gameName);
    if (!game || !metadata || metadata.gameName !== gameName) {
      return ctx.renderNotFound();
    }
    const debug = !isDenoDeploy;

    return <MatchClient {...{ game, matchID, debug }} />;
  },
);
