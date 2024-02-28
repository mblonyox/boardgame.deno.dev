import { defineRoute } from "$fresh/server.ts";
import LobbyBrowser from "~/islands/LobbyBrowser.tsx";

export default defineRoute((_req, ctx) => {
  const gameName = ctx.params.game;
  return <LobbyBrowser gameName={gameName} />;
});
