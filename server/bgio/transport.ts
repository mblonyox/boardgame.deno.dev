import PQueue from "p-queue";
import type { Game, StorageAPI } from "boardgame.io";
import { getFilterPlayerView } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import type { GenericPubSub } from "boardgame.io/server";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { upgradeWebSocket } from "hono/deno";
import type { WSContext } from "hono/ws";

type Client = {
  ws: WSContext;
  matchID: string;
  playerID?: string | null;
  credentials?: string;
};

type FilterPlayerView = ReturnType<typeof getFilterPlayerView>;

type IntermediateTransportData = Parameters<FilterPlayerView>[1];

type TransportData = ReturnType<FilterPlayerView>;

type TransportAPI = Master["transportAPI"];

type Auth = NonNullable<Master["auth"]>;

function emit(ws: WSContext, data: TransportData) {
  ws.send(JSON.stringify(data));
}

function getPubSubChannelId(matchID: string): string {
  return `MATCH-${matchID}`;
}

function transportAPI(
  matchID: string,
  ws: WSContext,
  filterPlayerView: FilterPlayerView,
  pubSub: GenericPubSub<IntermediateTransportData>,
): TransportAPI {
  return {
    send: ({ playerID, ...data }) => emit(ws, filterPlayerView(playerID, data)),
    sendAll: (payload) => pubSub.publish(getPubSubChannelId(matchID), payload),
  };
}

export class WebSocketTransport {
  private clientInfo: Map<string, Client>;
  private roomInfo: Map<string, Set<string>>;
  private perMatchQueue: Map<string, PQueue>;

  constructor(
    private games: Game[],
    private db: StorageAPI.Async | StorageAPI.Sync,
    private pubSub: GenericPubSub<IntermediateTransportData>,
    private auth?: Auth,
  ) {
    this.clientInfo = new Map();
    this.roomInfo = new Map();
    this.perMatchQueue = new Map();
  }

  private addClient(clientID: string, client: Client, game: Game) {
    const { matchID } = client;
    let matchClients = this.roomInfo.get(matchID);
    if (!matchClients) {
      this.subscribePubSubChannel(matchID, game);
      matchClients = new Set<string>();
      this.roomInfo.set(matchID, matchClients);
    }
    matchClients.add(clientID);
    this.clientInfo.set(clientID, client);
  }

  private removeClient(clientID: string) {
    const client = this.clientInfo.get(clientID);
    if (!client) return;
    const { matchID } = client;
    const matchClients = this.roomInfo.get(matchID);
    matchClients?.delete(clientID);
    if (matchClients?.size === 0) {
      this.unsubscribePubSubChannel(matchID);
      this.roomInfo.delete(matchID);
      this.deleteMatchQueue(matchID);
    }
    this.clientInfo.delete(clientID);
  }

  private subscribePubSubChannel(matchID: string, game: Game) {
    const filterPlayerView = getFilterPlayerView(game);
    const broadcast = (payload: IntermediateTransportData) => {
      this.roomInfo.get(matchID)?.forEach((clientID) => {
        const client = this.clientInfo.get(clientID);
        if (client) {
          const { ws, playerID } = client;
          const data = filterPlayerView(playerID ?? null, payload);
          emit(ws, data);
        }
      });
    };
    this.pubSub.subscribe(getPubSubChannelId(matchID), broadcast);
  }

  private unsubscribePubSubChannel(matchID: string) {
    this.pubSub.unsubscribeAll(getPubSubChannelId(matchID));
  }

  private getMatchQueue(matchID: string) {
    let matchQueue = this.perMatchQueue.get(matchID);
    if (!matchQueue) {
      matchQueue = new PQueue({ concurrency: 1 });
      this.perMatchQueue.set(matchID, matchQueue);
    }
    return matchQueue;
  }

  private deleteMatchQueue(matchID: string): void {
    this.perMatchQueue.delete(matchID);
  }

  app() {
    new Hono().get(
      "/ws/:name",
      createMiddleware(async (c, next) => {
        const { name } = c.req.param();
        const game = this.games.find((g) => g.name === name);
        if (!game) return c.notFound();
        c.set("game", game);
        c.set("filterPlayerView", getFilterPlayerView(game));
        await next();
      }),
      upgradeWebSocket((c) => {
        const clientID = crypto.randomUUID();
        const game = c.get("game") as Game;
        const filterPlayerView = c.get("filterPlayerView") as FilterPlayerView;
        return {
          onMessage: async (event, ws) => {
            const payload = JSON.parse(event.data.toString());
            switch (payload.type) {
              case "update":
                {
                  const args = payload.args as Parameters<Master["onUpdate"]>;
                  const [, , matchID] = args;
                  const transport = transportAPI(
                    matchID,
                    ws,
                    filterPlayerView,
                    this.pubSub,
                  );
                  const master = new Master(
                    game,
                    this.db,
                    transport,
                    this.auth,
                  );
                  await this.getMatchQueue(matchID).add(() =>
                    master.onUpdate(...args)
                  );
                }
                break;
              case "sync":
                {
                  const args = payload.args as Parameters<Master["onSync"]>;
                  const [matchID, playerID, credentials] = args;
                  this.removeClient(clientID);
                  const transport = transportAPI(
                    matchID,
                    ws,
                    filterPlayerView,
                    this.pubSub,
                  );
                  const master = new Master(
                    game,
                    this.db,
                    transport,
                    this.auth,
                  );
                  const syncResponse = await master.onSync(...args);
                  if (syncResponse && syncResponse.error === "unauthorized") {
                    return;
                  }
                  const requestingClient: Client = {
                    ws,
                    matchID,
                    playerID,
                    credentials,
                  };
                  this.addClient(clientID, requestingClient, game);
                  await master.onConnectionChange(
                    matchID,
                    playerID,
                    credentials,
                    true,
                  );
                }
                break;
              case "chat": {
                const args = payload.args as Parameters<
                  Master["onChatMessage"]
                >;
                const [matchID] = args;
                const transport = transportAPI(
                  matchID,
                  ws,
                  filterPlayerView,
                  this.pubSub,
                );
                const master = new Master(
                  game,
                  this.db,
                  transport,
                  this.auth,
                );
                await master.onChatMessage(...args);
                break;
              }
              default:
                break;
            }
          },
          onClose: async (_event, ws) => {
            const client = this.clientInfo.get(clientID);
            this.removeClient(clientID);
            if (client) {
              const { matchID, playerID, credentials } = client;
              const transport = transportAPI(
                matchID,
                ws,
                filterPlayerView,
                this.pubSub,
              );
              const master = new Master(
                game,
                this.db,
                transport,
                this.auth,
              );
              await master.onConnectionChange(
                matchID,
                playerID,
                credentials,
                false,
              );
            }
          },
        };
      }),
    );
  }
}
