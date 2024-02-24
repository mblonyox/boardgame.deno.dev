import { Transport } from "boardgame.io/internal";
import { ChatMessage, CredentialedActionShape, State } from "boardgame.io";
import { Master } from "boardgame.io/master";

type Options = ConstructorParameters<typeof Transport>[0] & { base?: string };

export class WebSocketTransport extends Transport {
  private url: URL;
  private socket?: WebSocket | null;

  constructor(opts: Options) {
    super(opts);
    const base = opts.base?.replace(/\/+$/, "") ?? "";
    const gameName = opts.gameName;
    this.url = new URL(
      `${base}/ws/games/${gameName}`,
      globalThis.location.origin.replace("http", "ws"),
    );
  }

  connect(): void {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("open", () => {
      this.requestSync();
      this.setConnectionStatus(true);
    });
    this.socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      this.notifyClient(data);
    });
    this.socket.addEventListener("close", () => {
      this.setConnectionStatus(false);
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.setConnectionStatus(false);
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
