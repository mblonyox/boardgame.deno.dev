import { BroadcastChannelPubSub } from "./pubsub.ts";
import { assertSpyCall, assertSpyCalls, spy } from "$std/testing/mock.ts";
import { delay } from "$std/async/delay.ts";

const CHANNEL = "foo";

Deno.test("broadcastchannel pubsub", async (t) => {
  await t.step("should receive message from subscription", async () => {
    const pubsub = new BroadcastChannelPubSub();
    const callback = spy((e: unknown) => console.log(e));
    const payload = "hello world";
    pubsub.subscribe(CHANNEL, callback);
    pubsub.publish(CHANNEL, payload);
    await delay(1);
    assertSpyCalls(callback, 1);
    assertSpyCall(callback, 0, { args: [payload] });
    pubsub.unsubscribeAll(CHANNEL);
    await delay(1);
  });
  await t.step("should receive message from two subscriptions", async () => {
    const pubsub = new BroadcastChannelPubSub();
    const callback = spy((e: unknown) => console.log(e));
    const payload = "hello world";
    pubsub.subscribe(CHANNEL, callback);
    pubsub.subscribe(CHANNEL, callback);
    pubsub.publish(CHANNEL, payload);
    await delay(1);
    assertSpyCalls(callback, 2);
    assertSpyCall(callback, 0, { args: [payload] });
    assertSpyCall(callback, 1, { args: [payload] });
    pubsub.unsubscribeAll(CHANNEL);
    await delay(1);
  });
  await t.step("should unsubscribe", async () => {
    const pubsub = new BroadcastChannelPubSub();
    const callback = spy((e: unknown) => console.log(e));
    const payload = "hello world";
    pubsub.subscribe(CHANNEL, callback);
    pubsub.unsubscribeAll(CHANNEL);
    pubsub.publish(CHANNEL, payload);
    await delay(1);
    assertSpyCalls(callback, 0);
    await delay(1);
  });
  await t.step("should ignore extra unsubscribe", async () => {
    const pubsub = new BroadcastChannelPubSub();
    const callback = spy((e: unknown) => console.log(e));
    const payload = "hello world";
    pubsub.subscribe(CHANNEL, callback);
    pubsub.unsubscribeAll(CHANNEL);
    pubsub.unsubscribeAll(CHANNEL);
    pubsub.publish(CHANNEL, payload);
    await delay(1);
    assertSpyCalls(callback, 0);
    await delay(1);
  });
});
