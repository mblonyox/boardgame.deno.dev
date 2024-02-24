import { Transport } from "boardgame.io/internal";
import { ChatMessage, CredentialedActionShape, State } from "boardgame.io";
import { Master } from "boardgame.io/master";

type Options = ConstructorParameters<typeof Transport>[0] & { prefix?: string };

export class WebSocketTransport extends Transport {
  private url: URL;
  private socket?: WebSocket;

  constructor(opts: Options) {
    super(opts);
    const prefix = opts.prefix;
    const gameName = opts.gameName;
    this.url = new URL(`${prefix}/game/${gameName}`);
  }
  connect(): void {
    this.socket = new WebSocket(this.url);
  }
  disconnect(): void {
    this.socket?.close();
  }
  sendAction(state: State, action: CredentialedActionShape.Any): void {
    const args: Parameters<Master["onUpdate"]> = [
      action,
      state._stateID,
      this.matchID,
      this.playerID!,
    ];
    this.socket?.send(JSON.stringify({ type: "update", args }));
  }
  sendChatMessage(matchID: string, chatMessage: ChatMessage): void {
    const args: Parameters<Master["onChatMessage"]> = [
      matchID,
      chatMessage,
      this.credentials,
    ];
    this.socket?.send(JSON.stringify({ type: "chat", args }));
  }
  requestSync(): void {
    const args: Parameters<Master["onSync"]> = [
      this.matchID,
      this.playerID,
      this.credentials,
      this.numPlayers,
    ];
    this.socket?.send(JSON.stringify({ type: "sync", args }));
  }
  updateMatchID(id: string): void {
    this.matchID = id;
    this.requestSync();
  }
  updatePlayerID(id: string): void {
    this.playerID = id;
    this.requestSync();
  }
  updateCredentials(credentials?: string): void {
    this.credentials = credentials;
    this.requestSync();
  }
}
