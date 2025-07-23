/*
 * Copyright 2018 The boardgame.io Authors
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */


import { Server, type ServerOptions, type Socket } from "socket.io";
import PQueue from "p-queue";
import type { Game, StorageAPI } from "boardgame.io";
import { Master } from "boardgame.io/master";
import { getFilterPlayerView } from "boardgame.io/internal";
import type { GenericPubSub } from "boardgame.io/server";
import { InMemoryPubSub } from "./pubsub/in-memory-pubsub.ts";
import { UnstorageDb } from "./db/unstorage-db.ts";
import type { Hono } from "hono";

type FilterPlayerView = ReturnType<typeof getFilterPlayerView>;

type IntermediateTransportData = Parameters<FilterPlayerView>[1];

type TransportData = ReturnType<FilterPlayerView>;

type MasterTransport = Master["transportAPI"];

type Auth = NonNullable<Master["auth"]>;

const PING_TIMEOUT = 20 * 1e3;
const PING_INTERVAL = 10 * 1e3;

const emit = (socket: Socket, { type, args }: TransportData) => {
  socket.emit(type, ...args);
};

function getPubSubChannelId(matchID: string): string {
  return `MATCH-${matchID}`;
}

/**
 * API that's exposed by SocketIO for the Master to send
 * information to the clients.
 */
export const TransportAPI = (
  matchID: string,
  socket: Socket,
  filterPlayerView: FilterPlayerView,
  pubSub: GenericPubSub<IntermediateTransportData>,
): MasterTransport => {
  const send: MasterTransport["send"] = ({ playerID, ...data }) => {
    emit(socket, filterPlayerView(playerID, data));
  };

  /**
   * Send a message to all clients.
   */
  const sendAll: MasterTransport["sendAll"] = (payload) => {
    pubSub.publish(getPubSubChannelId(matchID), payload);
  };

  return { send, sendAll };
};

export interface SocketOpts {
  games?: Game[];
  pubSub?: GenericPubSub<IntermediateTransportData>;
  db?: StorageAPI.Async | StorageAPI.Sync;
  auth?: Auth;
  socketOpts?: ServerOptions;
}

interface Client {
  matchID: string;
  playerID: string | null | undefined;
  socket: Socket;
  credentials: string | undefined;
}

/**
 * Transport interface that uses socket.io
 */
export class SocketIO {
  protected games: Game[];
  protected db: StorageAPI.Async | StorageAPI.Sync;
  protected auth?: Auth;
  protected clientInfo: Map<string, Client>;
  protected roomInfo: Map<string, Set<string>>;
  protected perMatchQueue: Map<string, PQueue>;
  private readonly socketOpts?: ServerOptions;
  protected pubSub: GenericPubSub<IntermediateTransportData>;

  constructor({ games, db, auth, socketOpts, pubSub }: SocketOpts = {}) {
    this.games = games ?? [];
    this.db = db ?? new UnstorageDb();
    this.auth = auth;
    this.clientInfo = new Map();
    this.roomInfo = new Map();
    this.perMatchQueue = new Map();
    this.socketOpts = socketOpts;
    this.pubSub = pubSub || new InMemoryPubSub();
  }

  /**
   * Unregister client data for a socket.
   */
  private removeClient(socketID: string): void {
    // Get client data for this socket ID.
    const client = this.clientInfo.get(socketID);
    if (!client) return;
    // Remove client from list of connected sockets for this match.
    const { matchID } = client;
    const matchClients = this.roomInfo.get(matchID);
    matchClients?.delete(socketID);
    // If the match is now empty, delete its promise queue & client ID list.
    if (matchClients && matchClients.size === 0) {
      this.unsubscribePubSubChannel(matchID);
      this.roomInfo.delete(matchID);
      this.deleteMatchQueue(matchID);
    }
    // Remove client data from the client map.
    this.clientInfo.delete(socketID);
  }

  /**
   * Register client data for a socket.
   */
  private addClient(client: Client, game: Game): void {
    const { matchID, socket } = client;
    // Add client to list of connected sockets for this match.
    let matchClients = this.roomInfo.get(matchID);
    if (matchClients === undefined) {
      this.subscribePubSubChannel(matchID, game);
      matchClients = new Set<string>();
      this.roomInfo.set(matchID, matchClients);
    }
    matchClients.add(socket.id);
    // Register data for this socket in the client map.
    this.clientInfo.set(socket.id, client);
  }

  private subscribePubSubChannel(matchID: string, game: Game) {
    const filterPlayerView = getFilterPlayerView(game);
    const broadcast = (payload: IntermediateTransportData) => {
      this.roomInfo.get(matchID)?.forEach((clientID) => {
        const client = this.clientInfo.get(clientID);
        if (!client) return;
        const data = filterPlayerView(client.playerID ?? null, payload);
        emit(client.socket, data);
      });
    };

    this.pubSub.subscribe(getPubSubChannelId(matchID), broadcast);
  }

  private unsubscribePubSubChannel(matchID: string) {
    this.pubSub.unsubscribeAll(getPubSubChannelId(matchID));
  }

  handler(app: Hono) {
    const io = new Server({
      pingTimeout: PING_TIMEOUT,
      pingInterval: PING_INTERVAL,
      ...this.socketOpts,
    });

    for (const game of this.games) {
      const nsp = io.of(game.name!);
      const filterPlayerView = getFilterPlayerView(game);

      nsp.on("connection", (socket: Socket) => {
        socket.on("update", async (...args: Parameters<Master["onUpdate"]>) => {
          const [action, stateID, matchID, playerID] = args;
          const master = new Master(
            game,
            this.db,
            TransportAPI(matchID, socket, filterPlayerView, this.pubSub),
            this.auth,
          );

          const matchQueue = this.getMatchQueue(matchID);
          await matchQueue.add(() =>
            master.onUpdate(action, stateID, matchID, playerID)
          );
        });

        socket.on("sync", async (...args: Parameters<Master["onSync"]>) => {
          const [matchID, playerID, credentials] = args;
          socket.join(matchID);
          this.removeClient(socket.id);
          const requestingClient: Client = {
            socket,
            matchID,
            playerID,
            credentials,
          };
          const transport = TransportAPI(
            matchID,
            socket,
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
          this.addClient(requestingClient, game);
          await master.onConnectionChange(matchID, playerID, credentials, true);
        });

        socket.on("disconnect", async () => {
          const client = this.clientInfo.get(socket.id);
          this.removeClient(socket.id);
          if (client) {
            const { matchID, playerID, credentials } = client;
            const master = new Master(
              game,
              this.db,
              TransportAPI(matchID, socket, filterPlayerView, this.pubSub),
              this.auth,
            );
            await master.onConnectionChange(
              matchID,
              playerID,
              credentials,
              false,
            );
          }
        });

        socket.on(
          "chat",
          async (...args: Parameters<Master["onChatMessage"]>) => {
            const [matchID] = args;
            const master = new Master(
              game,
              this.db,
              TransportAPI(matchID, socket, filterPlayerView, this.pubSub),
              this.auth,
            );
            await master.onChatMessage(...args);
          },
        );
      });
    }

    return io.handler(app.fetch);
  }

  /**
   * Create a PQueue for a given matchID if none exists and return it.
   * @param matchID
   * @returns
   */
  getMatchQueue(matchID: string): PQueue {
    if (!this.perMatchQueue.has(matchID)) {
      // PQueue should process only one action at a time.
      this.perMatchQueue.set(matchID, new PQueue({ concurrency: 1 }));
    }
    return this.perMatchQueue.get(matchID)!;
  }

  /**
   * Delete a PQueue for a given matchID.
   * @param matchID
   */
  deleteMatchQueue(matchID: string): void {
    this.perMatchQueue.delete(matchID);
  }
}
