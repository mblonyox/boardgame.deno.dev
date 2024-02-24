import { GenericPubSub } from "boardgame.io/server";

// deno-lint-ignore no-explicit-any
export class BroadcastChannelPubSub<T = any> implements GenericPubSub<T> {
  private channels: Map<string, WeakRef<BroadcastChannel>> = new Map();

  private getChannel(channelId: string): BroadcastChannel {
    let channel = this.channels.get(channelId)?.deref();
    if (!channel) {
      channel = new BroadcastChannel(channelId);
      this.channels.set(channelId, new WeakRef(channel));
    }
    return channel;
  }

  publish(channelId: string, payload: T): void {
    const channel = new BroadcastChannel(channelId);
    channel.postMessage(payload);
    channel.close();
  }

  subscribe(channelId: string, callback: (payload: T) => void): void {
    this.getChannel(channelId).addEventListener(
      "message",
      (event) => callback(event.data),
    );
  }

  unsubscribeAll(channelId: string): void {
    // try {
      this.channels.get(channelId)?.deref()?.close();
      this.channels.delete(channelId);
    // } catch (error) {
    //   if (error instanceof TypeError) return;
    //   throw error;
    // }
  }
}
