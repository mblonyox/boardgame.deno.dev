import { InMemoryPubSub } from "./in-memory-pubsub.ts";

export class BroadcastChannelPubSub<T> extends InMemoryPubSub<T>
  implements Disposable {
  private channels: Map<string, BroadcastChannel> = new Map();

  private getChannel(channelId: string): BroadcastChannel {
    let channel = this.channels.get(channelId);
    if (!channel) {
      channel = new BroadcastChannel(channelId);
      this.channels.set(channelId, channel);
    }
    return channel;
  }

  override publish(channelId: string, payload: T) {
    super.publish(channelId, payload);
    const channel = new BroadcastChannel(channelId);
    channel.postMessage(payload);
    channel.close();
  }

  override subscribe(channelId: string, callback: (payload: T) => void) {
    super.subscribe(channelId, callback);
    this.getChannel(channelId).addEventListener(
      "message",
      (event) => callback(event.data),
    );
  }

  override unsubscribeAll(channelId: string) {
    super.unsubscribeAll(channelId);
    this.channels.get(channelId)?.close();
    this.channels.delete(channelId);
  }

  close() {
    for (const channel of this.channels.values()) {
      try {
        channel.close();
      } catch (error) {
        if (error instanceof TypeError) return;
        throw error;
      }
    }
  }

  [Symbol.dispose]() {
    this.close();
  }
}
