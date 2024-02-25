import { Client } from "boardgame.io/client";

// deno-lint-ignore no-explicit-any
export type ClientState<G extends unknown = any> = ReturnType<
  ReturnType<typeof Client<G>>["getState"]
>;
