import { defineConfig } from "$fresh/server.ts";
import { boardgameio } from "~/lib/server/mod.ts";
import { default as games } from "~/lib/games/mod.ts";

export default defineConfig({
  plugins: [boardgameio(games)],
});
