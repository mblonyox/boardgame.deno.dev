import { PluginRoute } from "$fresh/server.ts";
import { Game, LobbyAPI, Server } from "boardgame.io";
import { Async, createMatch, Sync } from "boardgame.io/internal";
import { customAlphabet } from "nanoid";
import { Auth } from "./auth.ts";

const uuid = customAlphabet("123456789ABCDEFGHJKLMNPQRSTVWXYZ", 10);

const createClientMatchData = (
  matchID: string,
  metadata: Server.MatchData,
): LobbyAPI.Match => {
  return {
    ...metadata,
    matchID,
    players: Object.values(metadata.players).map((player) => {
      // strip away credentials
      const { credentials: _, ...strippedInfo } = player;
      return strippedInfo;
    }),
  };
};

const getNumPlayers = (players: Server.MatchData["players"]): number =>
  Object.keys(players).length;

const getFirstAvailablePlayerID = (
  players: Server.MatchData["players"],
): string | undefined => {
  const numPlayers = getNumPlayers(players);
  // Try to get the first index available
  for (let i = 0; i < numPlayers; i++) {
    if (typeof players[i].name === "undefined" || players[i].name === null) {
      return String(i);
    }
  }
};

export class API {
  constructor(
    private games: Game[],
    private db: Async | Sync,
    private auth: Auth,
  ) {
  }

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

  routes(base = ""): PluginRoute[] {
    return [{
      path: base + "/api/games",
      handler: (_req, _ctx) =>
        this.jsonResponse(this.games.map((game) => game.name)),
    }, {
      path: base + "/api/games/[name]/create",
      handler: {
        POST: async (req, ctx) => {
          const gameName = ctx.params.name;
          const game = this.games.find((game) => game.name === gameName);
          if (!game) return new Response("Not Found!", { status: 400 });
          const { setupData, unlisted, numPlayers } = await req.json();
          if (
            numPlayers !== undefined &&
              Number.isNaN(numPlayers) ||
            (game.minPlayers && numPlayers < game.minPlayers) ||
            (game.maxPlayers && numPlayers > game.maxPlayers)
          ) {
            throw new Response("Invalid numPlayers", { status: 400 });
          }
          const match = createMatch({ game, numPlayers, setupData, unlisted });
          if ("setupDataError" in match) {
            throw new Response(match["setupDataError"], { status: 400 });
          }
          const matchID = uuid();
          await this.db.createMatch(matchID, match);
          return this.jsonResponse({ matchID });
        },
      },
    }, {
      path: base + "/api/games/[name]",
      handler: async (_req, ctx) => {
        const gameName = ctx.params.name;
        const isGameoverParam = ctx.url.searchParams.get("isGameover");
        const updatedAfterParam = ctx.url.searchParams.get("updatedAfter");
        const updatedBeforeParam = ctx.url.searchParams.get("updatedBefore");
        const isGameover = typeof isGameoverParam === "string"
          ? isGameoverParam.toLowerCase() === "true"
          : undefined;
        const updatedAfter = parseInt(updatedAfterParam ?? "") || undefined;
        const updatedBefore = parseInt(updatedBeforeParam ?? "") || undefined;
        const matchList = await this.db.listMatches({
          gameName,
          where: { isGameover, updatedAfter, updatedBefore },
        });
        const matches = [];
        for await (const matchID of matchList) {
          const { metadata } = await this.db.fetch(matchID, { metadata: true });
          if (!metadata.unlisted) {
            matches.push(createClientMatchData(matchID, metadata));
          }
        }
        return this.jsonResponse({ matches });
      },
    }, {
      path: base + "/api/games/[name]/[id]/join",
      handler: {
        POST: async (req, ctx) => {
          const matchID = ctx.params.id;
          const { metadata } = await this.db.fetch(matchID, { metadata: true });
          if (!metadata || metadata.gameName !== ctx.params.name) {
            return new Response("Not Found!", { status: 400 });
          }
          const body = await req.json();
          const { playerName, data } = body;
          const playerID = body.playerID ??
            getFirstAvailablePlayerID(metadata.players);
          if (!playerID) {
            throw new Response(
              `Match ${matchID} reached maximum number of players (${
                getNumPlayers(metadata.players)
              })`,
              { status: 409 },
            );
          }
          if (!metadata.players[playerID]) {
            throw new Response(`Player ${playerID} not found.`, {
              status: 400,
            });
          }
          if (metadata.players[playerID].name) {
            throw new Response(`Player ${playerID} not available.`, {
              status: 409,
            });
          }
          metadata.players[playerID].name = playerName;
          if (data) {
            metadata.players[playerID].data = data;
          }
          const playerCredentials = await this.auth.generateCredentials(ctx);
          metadata.players[playerID].credentials = playerCredentials;
          await this.db.setMetadata(matchID, metadata);
          return this.jsonResponse({ playerID, playerCredentials });
        },
      },
    }, {
      path: base + "/games/[name]/[id]/leave",
      handler: {
        POST: async (req, ctx) => {
          const matchID = ctx.params.id;
          const { metadata } = await this.db.fetch(matchID, { metadata: true });
          if (!metadata || metadata.gameName !== ctx.params.name) {
            return new Response("Not Found!", { status: 400 });
          }
          const { playerID, credentials } = await req.json();
          if (!playerID) {
            throw new Response("playerID is required", { status: 400 });
          }
          if (!metadata.players[playerID]) {
            throw new Response(`Player ${playerID} not found.`, {
              status: 400,
            });
          }
          if (
            !this.auth.authenticateCredentials({
              playerID,
              credentials,
              metadata,
            })
          ) {
            throw new Response("Invalid credentials.", { status: 403 });
          }
          delete metadata.players[playerID].name;
          delete metadata.players[playerID].credentials;
          if (Object.values(metadata.players).some(({ name }) => name)) {
            this.db.setMetadata(matchID, metadata);
          } else {
            this.db.wipe(matchID);
          }
          return this.jsonResponse();
        },
      },
    }, {
      path: base + "/games/[name]/[id]/playAgain",
      handler: {
        POST: async (req, ctx) => {
          const matchID = ctx.params.id;
          const gameName = ctx.params.name;
          const game = this.games.find((game) => game.name === gameName);
          const { metadata } = await this.db.fetch(matchID, { metadata: true });
          if (!game || !metadata || metadata.gameName !== gameName) {
            return new Response("Not Found!", { status: 400 });
          }
          const body = await req.json();
          const { playerID, credentials, unlisted } = body;
          if (!playerID) {
            throw new Response("playerID is required", { status: 400 });
          }
          if (!metadata.players[playerID]) {
            throw new Response(`Player ${playerID} not found.`, {
              status: 400,
            });
          }
          if (
            !this.auth.authenticateCredentials({
              playerID,
              credentials,
              metadata,
            })
          ) {
            throw new Response("Invalid credentials.", { status: 403 });
          }
          if (metadata.nextMatchID) {
            return this.jsonResponse({ nextMatchID: metadata.nextMatchID });
          }
          const setupData = body.setupData || metadata.setupData;
          const numPlayers = body.numPlayers || getNumPlayers(metadata.players);
          const nextMatch = await createMatch({
            game,
            numPlayers,
            setupData,
            unlisted,
          });
          if ("setupDataError" in nextMatch) {
            throw new Response(nextMatch["setupDataError"], { status: 400 });
          }
          const nextMatchID = uuid();
          await this.db.createMatch(nextMatchID, nextMatch);
          metadata.nextMatchID = nextMatchID;
          await this.db.setMetadata(matchID, metadata);
          return this.jsonResponse({ nextMatchID });
        },
      },
    }, {
      path: base + "/games/[name]/[id]/update",
      handler: {
        POST: async (req, ctx) => {
          const matchID = ctx.params.id;
          const { metadata } = await this.db.fetch(matchID, { metadata: true });
          if (!metadata || metadata.gameName !== ctx.params.name) {
            return new Response("Not Found!", { status: 400 });
          }
          const { playerID, credentials, newName, data } = await req.json();
          if (!playerID) {
            throw new Response("playerID is required", { status: 400 });
          }
          if (!metadata.players[playerID]) {
            throw new Response(`Player ${playerID} not found.`, {
              status: 400,
            });
          }
          if (
            !this.auth.authenticateCredentials({
              playerID,
              credentials,
              metadata,
            })
          ) {
            throw new Response("Invalid credentials.", { status: 403 });
          }
          if (!newName && !data) {
            throw new Response("newName or data is required.", { status: 400 });
          }
          if (newName) {
            metadata.players[playerID].name = newName;
          }
          if (data) {
            metadata.players[playerID].data = data;
          }
          await this.db.setMetadata(matchID, metadata);
          return this.jsonResponse();
        },
      },
    }, {
      path: base + "/games/[name]/[id]/rename",
      handler: {
        POST: (_req, ctx) => {
          console.warn(
            "This endpoint /rename is deprecated. Please use /update instead.",
          );
          const gameName = ctx.params.name;
          const matchID = ctx.params.id;
          return Response.redirect(
            base + `/games/${gameName}/${matchID}/update`,
            308,
          );
        },
      },
    }];
  }
}
