import { LobbyAPI } from "boardgame.io";
import { LobbyClient } from "boardgame.io/client";
import { useSignal, useSignalEffect } from "@preact/signals";

import CreateMatchButton from "~/islands/CreateMatchButton.tsx";

type Props = {
  gameName: string;
};

type IsGameoverValues = "true" | "false" | "null";

const isGameoverOptions = [
  { label: "All Matches", value: "null" },
  { label: "Game Over", value: "true" },
  { label: "On Going", value: "false" },
];

export default function LobbyBrowser({ gameName }: Props) {
  const isPending = useSignal(false);
  const matches = useSignal<LobbyAPI.Match[]>([]);
  const isGameoverFilter = useSignal<IsGameoverValues>("null");
  useSignalEffect(() => {
    isPending.value = true;
    const isGameover = JSON.parse(isGameoverFilter.value) ?? undefined;
    const client = new LobbyClient({ server: "/api" });
    client.listMatches(gameName, { isGameover })
      .then((matchList) => matches.value = matchList.matches)
      .finally(() => isPending.value = false);
  });

  return (
    <div className="container my-3">
      <div className="row">
        <div className="col-12 col-md-6 my-1">
          <select
            className="form-select"
            name="isGameover"
            value={isGameoverFilter}
            onChange={(e) => {
              isGameoverFilter.value = e.currentTarget
                .value as IsGameoverValues;
            }}
          >
            {isGameoverOptions.map(({ label, value }) => (
              <option {...{ value }}>{label}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-6 my-1 d-grid d-md-flex justify-content-md-end">
          <CreateMatchButton {...{ gameName }} />
        </div>
      </div>
      <div className="row">
        {isPending.value && (
          <div className="col-12 text-center p-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {!isPending.value && !matches.value.length && (
          <div className="col-12 text-center p-5">
            <h5>No Match available.</h5>
          </div>
        )}
        {!isPending.value &&
          matches.value.map(({ matchID, gameName, players }) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 my-1">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    <a href={`/${gameName}/${matchID}`}>
                      #{matchID}
                    </a>
                  </h5>
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
    </div>
  );
}
