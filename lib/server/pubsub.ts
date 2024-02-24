import { GenericPubSub } from "boardgame.io/server";

// deno-lint-ignore no-explicit-any
export class BroadcastChannelPubSub<T = any> implements GenericPubSub<T> {
  private channels: Map<string, BroadcastChannel> = new Map();

  private getChannel(channelId: string): BroadcastChannel {
    let channel = this.channels.get(channelId);
    if (!channel) {
      channel = new BroadcastChannel(channelId);
      this.channels.set(channelId, channel);
    }
    return channel;
  }

  publish(channelId: string, payload: T): void {
    this.getChannel(channelId).postMessage(payload);
  }

  subscribe(channelId: string, callback: (payload: T) => void): void {
    this.getChannel(channelId).addEventListener(
      "message",
      (event) => callback(event.data),
    );
  }

  unsubscribeAll(channelId: string): void {
    this.channels.get(channelId)?.close();
  }
}
