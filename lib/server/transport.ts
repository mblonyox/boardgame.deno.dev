import { PluginRoute } from "$fresh/server.ts";
import PQueue from "p-queue";
import { Game } from "boardgame.io";
import { Async, getFilterPlayerView, Sync } from "boardgame.io/internal";
import { Master } from "boardgame.io/master";
import { GenericPubSub } from "boardgame.io/server";
import { Auth } from "./auth.ts";

type Client = {
  socketRef: WeakRef<WebSocket>;
  matchID: string;
  playerID?: string | null;
  credentials?: string;
};

type FilterPlayerView = ReturnType<typeof getFilterPlayerView>;

type IntermediateTransportData = Parameters<FilterPlayerView>[1];

type TransportData = ReturnType<FilterPlayerView>;

function emit(socketRef: WeakRef<WebSocket>, data: TransportData) {
  socketRef.deref()?.send(JSON.stringify(data));
}

function getPubSubChannelId(matchID: string): string {
  return `MATCH-${matchID}`;
}

function TransportAPI(
  matchID: string,
  socketRef: WeakRef<WebSocket>,
  filterPlayerView: FilterPlayerView,
  pubSub: GenericPubSub<IntermediateTransportData>,
): Master["transportAPI"] {
  return {
    send: ({ playerID, ...data }) =>
      emit(socketRef, filterPlayerView(playerID, data)),
    sendAll: (payload) => pubSub.publish(getPubSubChannelId(matchID), payload),
  };
}

export class WebSocketTransport {
  private clientInfo: Map<string, Client>;
  private roomInfo: Map<string, Set<string>>;
  private perMatchQueue: Map<string, PQueue>;

  constructor(
    private games: Game[],
    private db: Async | Sync,
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
          const { socketRef, playerID } = client;
          const data = filterPlayerView(playerID ?? null, payload);
          emit(socketRef, data);
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

  route(): PluginRoute {
    return {
      path: "/ws/games/[name]",
      handler: (req, ctx) => {
        const name = ctx.params.name;
        const game = this.games.find((g) => g.name === name);
        if (!game) return ctx.renderNotFound();
        const filterPlayerView = getFilterPlayerView(game);
        if (
          req.headers.get("connection") === "Upgrade" &&
          req.headers.get("upgrade") === "websocket"
        ) {
          const { socket, response } = Deno.upgradeWebSocket(req);
          const clientID = crypto.randomUUID();
          const socketRef = new WeakRef(socket);
          const messageEventHandler = async (event: MessageEvent) => {
            const payload = JSON.parse(event.data);
            switch (payload.type) {
              case "update":
                {
                  const args = payload.args as Parameters<Master["onUpdate"]>;
                  const [, , matchID] = args;
                  const transport = TransportAPI(
                    matchID,
                    socketRef,
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
                  const requestingClient: Client = {
                    socketRef,
                    matchID,
                    playerID,
                    credentials,
                  };
                  const transport = TransportAPI(
                    matchID,
                    socketRef,
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
                const transport = TransportAPI(
                  matchID,
                  socketRef,
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
          };
          const closeEventHandler = async (_event: CloseEvent) => {
            const client = this.clientInfo.get(clientID);
            this.removeClient(clientID);
            if (client) {
              const { matchID, playerID, credentials } = client;
              const transport = TransportAPI(
                matchID,
                socketRef,
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
            socket.removeEventListener("message", messageEventHandler);
            socket.removeEventListener("close", closeEventHandler);
          };
          socket.addEventListener("message", messageEventHandler);
          socket.addEventListener("close", closeEventHandler);
          return response;
        }
        return ctx.next();
      },
    };
  }
}
