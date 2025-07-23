import { describe, it } from "jsr:@std/testing/bdd";
import { expect, fn } from "jsr:@std/expect";
import { InMemoryPubSub } from "./in-memory-pubsub.ts";

const CHANNEL_FOO = "foo";

describe("in-memory pubsub", () => {
  it("should receive message from subscription", () => {
    const pubSub = new InMemoryPubSub<string>();
    const callback = fn() as () => void;
    pubSub.subscribe(CHANNEL_FOO, callback);
    const payload = "hello world";
    pubSub.publish(CHANNEL_FOO, payload);
    expect(callback).toHaveBeenCalledWith(payload);
  });

  it("should receive message from two subscriptions", () => {
    const pubSub = new InMemoryPubSub<string>();
    const callback1 = fn() as () => void;
    const callback2 = fn() as () => void;
    pubSub.subscribe(CHANNEL_FOO, callback1);
    pubSub.subscribe(CHANNEL_FOO, callback2);
    const payload = "hello world";
    pubSub.publish(CHANNEL_FOO, payload);
    expect(callback1).toHaveBeenCalledWith(payload);
    expect(callback2).toHaveBeenCalledWith(payload);
  });

  it("should unsubscribe", () => {
    const pubSub = new InMemoryPubSub<string>();
    const callback = fn() as () => void;
    pubSub.subscribe(CHANNEL_FOO, callback);
    pubSub.unsubscribeAll(CHANNEL_FOO);
    const payload = "hello world";
    pubSub.publish(CHANNEL_FOO, payload);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should ignore extra unsubscribe", () => {
    const pubSub = new InMemoryPubSub<string>();
    const callback = fn() as () => void;
    pubSub.subscribe(CHANNEL_FOO, callback);
    pubSub.unsubscribeAll(CHANNEL_FOO);
    pubSub.unsubscribeAll(CHANNEL_FOO); // do nothing
    const payload = "hello world";
    pubSub.publish(CHANNEL_FOO, payload);
    expect(callback).not.toHaveBeenCalled();
  });
});
