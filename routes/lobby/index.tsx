import { defineRoute } from "$fresh/server.ts";
import LobbyBrowser from "~/islands/LobbyBrowser.tsx";

export default defineRoute<Record<string, unknown>>((req, ctx) => {
  return (
    <div className="container">
      <div className="col-12 col-lg-8">
        <h1>Welcome ${}!</h1>
        <p>Create or Join available rooms.</p>
        <LobbyBrowser />
      </div>
    </div>
  );
});
