import { IS_BROWSER } from "$fresh/runtime.ts";
import { Client } from "boardgame.io/client";
import { useEffect, useRef, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { WebSocketTransport } from "~/lib/client/transport.ts";
import { NoThanksGameState } from "~/lib/games/no-thanks.ts";
import { NoThanks } from "~/lib/games/no-thanks.ts";

type Props = {
  id?: string;
};

type ClientState<T> = ReturnType<ReturnType<typeof Client<T>>["getState"]>;

export default function NoThanksClient({ id }: Props) {
  const [state, setState] = useState<ClientState<NoThanksGameState>>();
  const clientRef = useRef<ReturnType<typeof Client<NoThanksGameState>>>();
  useEffect(() => {
    if (IS_BROWSER) {
      const client = Client({
        game: NoThanks,
        numPlayers: 3,
        matchID: "",
        playerID: "",
        multiplayer: (opts) => new WebSocketTransport(opts),
      });
      client.start();
      client.subscribe((state) => setState(state));
      clientRef.current = client;
    }
  }, []);
  const g = state?.G;
  return (
    <>
      <div className="container text-center">
        <div className="row justify-content-center m-1 m-md-3">
          <div className="col-6 col-sm-4 col-md-3 col-lg-2">
            <Deck size={g?.deckSize} />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-2">
            <ActiveCard {...g?.activeCard} counters={g?.activeCounters} />
          </div>
        </div>
        <div className="row justify-content-center m-1 m-md-3">
          {!!state?.ctx.gameover && (
            <>
              <div className="alert alert-danger">
                Game Over.
                <button
                  type="button"
                  class="btn btn-danger m-1"
                  data-bs-toggle="modal"
                  data-bs-target="#score-modal"
                >
                  Show Score
                </button>
              </div>
            </>
          )}
          {!state?.ctx.gameover && state?.isActive &&
            (
              <div className="alert alert-primary" role="alert">
                Choose your action:
                <button
                  type="button"
                  className="btn btn-outline-primary m-1"
                  onClick={() => clientRef.current?.moves?.take()}
                >
                  Take
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary m-1"
                  onClick={() => clientRef.current?.moves?.pass()}
                >
                  Pass
                </button>
              </div>
            )}
          {!state?.ctx.gameover && !state?.isActive && (
            <div className="alert alert-info">
              Waiting player <strong>{state?.ctx.currentPlayer}</strong>
            </div>
          )}
        </div>
        <div className="row justify-content-center m-1 m-md-3">
          {Object.entries(g?.tableu ?? {}).map(([playerID, { cards }]) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
              <div className="card">
                <div className="card-title">Player: {playerID}</div>
                <div className="card-body">
                  <p>
                    <span class="badge rounded-pill text-bg-info">
                      Counter : {g?.players[playerID]?.counters ?? "?"}
                    </span>
                  </p>
                  <hr />
                  <OwnedCards cards={cards} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        id="score-modal"
        className="modal fade"
        tabindex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">Game Over</div>
            <div className="modal-body">
              <h1 className="text-center">Score</h1>
              <table className="table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Point</th>
                  </tr>
                </thead>
                <tbody>
                  {!!state?.ctx.gameover &&
                    Object.entries(state?.ctx.gameover.scores).map((
                      [playerID, score],
                    ) => (
                      <tr>
                        <td>{playerID}</td>
                        <td>{score as string}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActiveCard(
  { value, counters, ...props }:
    & { value?: number; counters?: number }
    & JSX.HTMLAttributes<HTMLDivElement>,
) {
  return (
    <>
      <div
        className="w-100 border-success rounded p-1 p-md-2"
        style={{ aspectRatio: "5/7", border: "1px dashed" }}
      >
        {value &&
          (
            <div
              className="card text-center justify-content-center border border-5 border-dark rounded-3"
              style={{ aspectRatio: "5/7" }}
              {...props}
            >
              <div className="card-title">
                <h1>
                  {value}
                </h1>
              </div>
            </div>
          )}
      </div>
      <p>
        <span class="badge rounded-pill text-bg-info">
          Counter : {counters}
        </span>
      </p>
    </>
  );
}

function OwnedCards({ cards }: { cards: { value: number }[] }) {
  return (
    <div className="d-flex flex-wrap" style={{ gap: "0.5rem" }}>
      {cards
        .toSorted((a, b) => (b.value - a.value))
        .reduce<{ value: number }[][]>((acc, card) => {
          if (acc.at(0)?.at(-1)?.value === card.value + 1) {
            acc.at(0)?.push(card);
          } else {
            acc.unshift([card]);
          }
          return acc;
        }, [[]])
        .map((cards) => (
          <div className="d-flex flex-column">
            {cards.map(({ value }, i) => (
              <div
                className="card position-relative text-center justify-content-center border border-3 border-dark rounded-2"
                style={{
                  width: "2.5rem",
                  aspectRatio: "5/7",
                  marginTop: i > 0 ? "-100%" : 0,
                }}
              >
                {value}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function Deck(
  { size, ...props }: JSX.HTMLAttributes<HTMLDivElement> & { size?: number },
) {
  return (
    <div
      className="w-100 border-info rounded p-1 p-md-2"
      style={{ aspectRatio: "5/7", border: "1px dashed" }}
    >
      <div
        className="position-relative w-100"
        style={{ aspectRatio: "5/7" }}
        {...props}
      >
        {Array(size).fill(null).map((_, i) => (
          <div
            className="card position-absolute justify-content-center w-100"
            style={{ top: -i, left: -i, aspectRatio: "5/7" }}
          >
            <div className="card-title">
              <h1>No</h1>
              <h5>Thanks!</h5>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
