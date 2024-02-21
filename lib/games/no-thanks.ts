import { Game } from "boardgame.io";
import { INVALID_MOVE, PlayerView } from "boardgame.io/core";

export type Card = {
  value: number;
};

export type NoThanksGameState = {
  deckSize: number;
  activeCard: Card | null;
  activeCounters: number;
  secret?: {
    deckContent: Card[];
  };
  tableu: {
    [playerID: string]: { cards: Card[] };
  };
  players: {
    [playerID: string]: { counters: number };
  };
};

export const NoThanks: Game<NoThanksGameState> = {
  name: "no-thanks",
  minPlayers: 3,
  maxPlayers: 7,
  setup({ ctx, random }) {
    const deckContent = random.Shuffle(
      Array<number>(33)
        .fill(3)
        .map((n, i) => ({ value: n + i })),
    ).slice(9);

    const activeCard = deckContent.pop() ?? null;

    const tableu = Object.fromEntries(
      ctx.playOrder.map((playerID) => [playerID, { cards: [] }]),
    );

    const players = Object.fromEntries(
      ctx.playOrder.map(
        (playerID) => [playerID, {
          counters: ctx.numPlayers >= 7 ? 7 : ctx.numPlayers >= 6 ? 9 : 11,
        }],
      ),
    );

    return {
      deckSize: deckContent.length,
      activeCard,
      activeCounters: 0,
      tableu,
      secret: { deckContent },
      players,
    };
  },
  playerView: PlayerView.STRIP_SECRETS,
  moves: {
    pass: {
      move: ({ G, playerID, events }) => {
        if (!G.players[playerID].counters) return INVALID_MOVE;
        G.players[playerID].counters--;
        G.activeCounters++;
        events.endTurn();
      },
      client: false,
    },
    take: {
      move: ({ G, playerID }) => {
        G.tableu[playerID].cards.push(G.activeCard!);
        G.players[playerID].counters += G.activeCounters;
        G.activeCounters = 0;
        G.deckSize && G.deckSize--;
        G.activeCard = G.secret?.deckContent.pop() ?? null;
      },
      client: false,
    },
  },
  endIf({ G, ctx }) {
    if (!G.activeCard) {
      return {
        scores: Object.fromEntries(
          ctx.playOrder.map((playerID) => [
            playerID,
            G.tableu[playerID].cards
              .toSorted((a, b) => a.value - b.value)
              .reduce(
                (total, { value }, i, cards) =>
                  total + ((value - 1) === cards.at(i - 1)?.value ? 0 : value),
                0,
              ) - G.players[playerID].counters,
          ]),
        ),
      };
    }
  },
};
