import { LobbyClient } from "boardgame.io/client";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useRef, useState } from "preact/hooks";

export default function LobbyBrowser() {
  const clientRef = useRef<LobbyClient>();
  const [games, setGames] = useState([]);
  useEffect(() => {
    if (IS_BROWSER) {
      const client = new LobbyClient();
      clientRef.current = client;
      client.listGames()
    }
  }, []);

  return <></>;
}
