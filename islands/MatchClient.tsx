import { IS_BROWSER } from "$fresh/runtime.ts";
import { FilteredMetadata, Game } from "boardgame.io";
import { Client, LobbyClient } from "boardgame.io/client";
import { ComponentType } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { WebSocketTransport } from "~/lib/client/transport.ts";
import { ClientState } from "~/lib/client/types.ts";

import NoThanksClient from "./NoThanksClient.tsx";
import ConfirmReady from "./ConfirmReady.tsx";

type BoardProps = {
  state?: ClientState;
  onMove?: (type: string, args?: unknown[]) => void;
};

type JoinedMatch = { playerID: string; playerCredentials: string };

type Props<G> = {
  game: Game<G>;
  matchID: string;
  debug?: boolean;
};

const getJoinedMatchÏ = (matchID: string) => {
  if (IS_BROWSER) {
    return JSON.parse(
      localStorage.getItem(`matchID:${matchID}`) ?? "null",
    ) as JoinedMatch | null;
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
  const [joinedMatch, setJoinedMatch] = useState(getJoinedMatchÏ(matchID));
  const [state, setState] = useState<ClientState<G>>();
  const [matchData, setMatchData] = useState<FilteredMetadata>();
  useEffect(() => {
    lobbyClientRef.current = new LobbyClient({ server: "/api" });
  }, []);
  useEffect(() => {
    clientRef.current?.stop();
    const { playerID, playerCredentials: credentials } = joinedMatch ?? {};
    const client = Client({
      game,
      matchID,
      playerID,
      credentials,
      debug,
      multiplayer: (opts) => new WebSocketTransport(opts),
    });
    client.start();
    client.subscribe((state) => {
      setState(state);
      setMatchData(client.matchData);
    });
    clientRef.current = client;
  }, [joinedMatch]);
  const onMove = useCallback((type: string, args?: unknown[]) => {
    clientRef.current?.moves[type]?.(...(args ?? []));
  }, []);
  const onJoinMatch = useCallback(async (playerID: string) => {
    const result = await lobbyClientRef.current?.joinMatch(
      game.name!,
      matchID,
      {
        playerName: "unknown",
        playerID,
      },
    );
    if (result) {
      localStorage.setItem(`matchID:${matchID}`, JSON.stringify(result));
      setJoinedMatch(result);
    }
  }, []);
  const onLeaveMatch = useCallback(async () => {
    const { playerID, playerCredentials: credentials } = joinedMatch ?? {};
    if (!playerID || !credentials) return;
    await lobbyClientRef.current?.leaveMatch(game.name!, matchID, {
      playerID,
      credentials,
    });
    setJoinedMatch(null);
  }, [joinedMatch]);
  const Board = boards[game.name!];
  return (
    <>
      {false && <Board {...{ state, onMove }} />}
      <ConfirmReady {...{ matchData, onJoinMatch, onLeaveMatch }} />
    </>
  );
}
