import { IS_BROWSER } from "$fresh/runtime.ts";
import { Game } from "boardgame.io";
import { Client, LobbyClient } from "boardgame.io/client";
import { ComponentType } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { WebSocketTransport } from "~/lib/client/transport.ts";
import { ClientState } from "~/lib/client/types.ts";

import NoThanksClient from "./NoThanksClient.tsx";

type BoardProps = {
  state?: ClientState;
  onMove?: (type: string, args?: unknown[]) => void;
};

type Props<G> = {
  game: Game<G>;
  matchID: string;
  debug?: boolean;
};

const getIdCreds = (matchID: string) => {
  if (IS_BROWSER) {
    return localStorage.getItem(`matchID:${matchID}`);
  }
};

const boards: Record<string, ComponentType<BoardProps>> = {
  "no-thanks": NoThanksClient,
};

export default function MatchClient<G>(
  { game, matchID, debug }: Props<G>,
) {
  const clientRef = useRef<ReturnType<typeof Client<G>>>();
  const lobbyClientRef = useRef<LobbyClient>();
  const [idCreds, setIdCreds] = useState(getIdCreds(matchID));
  const [state, setState] = useState<ClientState<G>>();
  useEffect(() => {
    lobbyClientRef.current = new LobbyClient({ server: "/api" });
    const [playerID, credentials] = idCreds?.split(":") ?? [];
    clientRef.current = Client({
      game,
      matchID,
      playerID,
      credentials,
      debug,
      multiplayer: (opts) => new WebSocketTransport(opts),
    });
    clientRef.current.start();
    clientRef.current.subscribe((state) => setState(state));
  }, []);
  const onMove = useCallback((type: string, args?: unknown[]) => {
    clientRef.current?.moves[type]?.(...(args ?? []));
  }, []);
  const Board = boards[game.name!];
  return <Board {...{ state, onMove }} />;
}
