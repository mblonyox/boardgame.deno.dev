import { LobbyAPI } from "boardgame.io";
import { LobbyClient } from "boardgame.io/client";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  adjectives,
  animals,
  colors,
  names,
  uniqueNamesGenerator,
} from "unique-names-generator";

type Props = {
  gameName: string;
};

type IsGameoverValues = "true" | "false" | "null";

const isGameoverOptions = [
  { label: "All Matches", value: "null" },
  { label: "Game Over", value: "true" },
  { label: "On Going", value: "false" },
];

const uniqueName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors, names],
    separator: "-",
    length: 2,
  });

export default function LobbyBrowser({ gameName }: Props) {
  const clientRef = useRef<LobbyClient>();
  const [matchList, setMatches] = useState<LobbyAPI.MatchList>();
  const [isGameover, setIsGameover] = useState<IsGameoverValues>("null");
  const [playerName, setPlayerName] = useState(uniqueName());
  const [numPlayers, setNumPlayers] = useState(3);
  useEffect(() => {
    if (!IS_BROWSER) return;
    const client = new LobbyClient({ server: "/api" });
    clientRef.current = client;
  }, []);
  useEffect(() => {
    if (!IS_BROWSER) return;
    clientRef.current?.listMatches(gameName, {
      isGameover: JSON.parse(isGameover) ?? undefined,
    }).then(setMatches);
  }, [isGameover]);
  const onCreateMatchSubmit = async () => {
    if (!IS_BROWSER) return;
    const createdMatch = await clientRef.current?.createMatch(gameName, {
      numPlayers,
    });
    if (createdMatch) {
      const joinedMatch = await clientRef.current?.joinMatch(
        gameName,
        createdMatch.matchID,
        { playerID: "0", playerName },
      );
      if (joinedMatch) {
        localStorage.setItem(
          `matchID:${createdMatch.matchID}`,
          JSON.stringify(joinedMatch),
        );
        globalThis.location.assign(`/${gameName}/${createdMatch.matchID}`);
      }
    }
  };

  return (
    <div className="container my-3">
      <div className="row">
        <div className="col-12 col-md-6 my-1">
          <select
            className="form-select"
            name="isGameover"
            value={isGameover}
            onChange={(e) => {
              setIsGameover(e.currentTarget.value as IsGameoverValues);
            }}
          >
            {isGameoverOptions.map(({ label, value }) => (
              <option {...{ value }}>{label}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-6 my-1 d-grid d-md-flex justify-content-md-end">
          <button
            className="btn btn-outline-primary"
            data-bs-toggle="modal"
            data-bs-target="#createMatchModal"
          >
            Create Match
          </button>
        </div>
      </div>
      <div className="row">
        {!matchList && (
          <div className="col-12 text-center p-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {!!matchList?.matches && !matchList?.matches.length && (
          <div className="col-12 text-center p-5">
            <h5>No Match available.</h5>
          </div>
        )}
        {matchList?.matches.map(({ matchID, gameName, players }) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3 my-1">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">#{matchID}</h5>
                <p>{gameName}</p>
                {players.map((p) => (
                  p.name &&
                  <span className="badge text-bg-secondary">{p.name}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        class="modal fade"
        id="createMatchModal"
        tabindex={-1}
        aria-labelledby="createMathcModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="createMathcModalLabel">
                Create a new Match
              </h1>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
              </button>
            </div>
            <div class="modal-body">
              <div className="row mb-3">
                <div className="col-3">
                  <label htmlFor="playerNameInput" className="form-label">
                    Nickname
                  </label>
                </div>
                <div className="col-9">
                  <input
                    type="text"
                    name="playerName"
                    id="playerNameInput"
                    className="form-control"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.currentTarget.value)}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-3">
                  <label className="form-label" htmlFor="numPlayersInput">
                    Players
                  </label>
                </div>
                <div className="col-9">
                  <input
                    type="range"
                    className="form-range col-9"
                    name="numPlayers"
                    id="numPlayersInput"
                    min={3}
                    max={7}
                    value={numPlayers}
                    onChange={(e) =>
                      setNumPlayers(parseInt(e.currentTarget.value))}
                  />
                  {numPlayers}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                type="button"
                class="btn btn-primary"
                onClick={onCreateMatchSubmit}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
