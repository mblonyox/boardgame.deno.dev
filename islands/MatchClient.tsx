import { IS_BROWSER } from "$fresh/runtime.ts";
import { ComponentType } from "preact";
import { useRef } from "preact/hooks";
import {
  batch,
  ReadonlySignal,
  useComputed,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { FilteredMetadata, Game, LobbyAPI } from "boardgame.io";
import { Client } from "boardgame.io/client";
import { WebSocketTransport } from "~/lib/client/transport.ts";
import { ClientState } from "~/lib/client/types.ts";

import NoThanksClient from "./NoThanksClient.tsx";
import AssignPlayers from "./AssignPlayers.tsx";
import LoadingSpinner from "~/islands/LoadingSpinner.tsx";

type Client = ReturnType<typeof Client>;

type BoardProps = {
  $clientState?: ReadonlySignal<ClientState>;
  onMove?: (type: string, args?: unknown[]) => void;
};

type Props<G> = {
  game: Game<G>;
  matchID: string;
  debug?: boolean;
};

const getJoinedMatch = (matchID: string) => {
  if (IS_BROWSER) {
    const item = localStorage.getItem(`match:${matchID}`);
    if (item) {
      return JSON.parse(item) as LobbyAPI.JoinedMatch;
    }
  }
  return null;
};

const boards: Record<string, ComponentType<BoardProps>> = {
  "no-thanks": NoThanksClient,
};

export default function MatchClient<G>({ game, matchID, debug }: Props<G>) {
  const gameName = game.name!;
  const clientRef = useRef<Client>();
  const $joinedMatch = useSignal(getJoinedMatch(matchID));
  const $matchData = useSignal<FilteredMetadata | null>(null);
  const $clientState = useSignal<ClientState>(null);
  const $isReady = useComputed(() =>
    $matchData.value?.every(({ name }) => !!name)
  );
  useSignalEffect(() => {
    const { playerID, playerCredentials } = $joinedMatch.value ?? {};
    const client = Client({
      game,
      matchID,
      playerID,
      credentials: playerCredentials,
      debug,
      multiplayer: (opts) => new WebSocketTransport(opts),
    });
    client.subscribe((state) =>
      batch(() => {
        $clientState.value = state;
        $matchData.value = client.matchData ?? null;
      })
    );
    client.start();
    clientRef.current = client;
    return () => {
      client.stop();
      clientRef.current = undefined;
    };
  });
  if (!$matchData.value && !$clientState.value) {
    return <LoadingSpinner className="min-vh-100" />;
  }
  if (!$isReady.value) {
    return (
      <AssignPlayers {...{ gameName, matchID, $joinedMatch, $matchData }} />
    );
  }
  const Board = boards[game.name!];
  const onMove = (type: string, args?: unknown[]) => {
    clientRef.current?.moves[type]?.(...(args ?? []));
  };
  return <Board {...{ $clientState, onMove }} />;
}
