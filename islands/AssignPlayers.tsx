import { FilteredMetadata, LobbyAPI } from "boardgame.io";
import { ReadonlySignal, Signal } from "@preact/signals";

import JoinMatchButton from "~/islands/JoinMatchButton.tsx";
import LeaveMatchButton from "~/islands/LeaveMatchButton.tsx";

type Props = {
  gameName: string;
  matchID: string;
  $joinedMatch: Signal<LobbyAPI.JoinedMatch | null>;
  $matchData: ReadonlySignal<FilteredMetadata | null>;
};

export default function AssignPlayers(
  { gameName, matchID, $joinedMatch, $matchData }: Props,
) {
  return (
    <div className="container my-3">
      <div className="row justify-content-space-around my-1">
        <div className="col-auto">
          <a href={`/${gameName}`} className="btn btn-outline-secondary">
            Back
          </a>
        </div>
        <div className="col text-center">
          Join Match #{matchID}
        </div>
        <div className="col-auto">
        </div>
      </div>
      <hr />
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 justify-content-center my-3">
        {$matchData.value?.map(({ id, name, isConnected }) => (
          <div className="col my-1" key={id}>
            <div className="card">
              <div
                className="card-body text-center d-flex flex-column justify-content-center"
                style={{ minHeight: "10rem" }}
              >
                {!name
                  ? <small className="my-3">(waiting for player...)</small>
                  : (
                    <span className="btn btn-outline-secondary position-relative my-1">
                      <strong>{name}</strong>
                      {isConnected !== undefined &&
                        (
                          <span
                            class={`position-absolute top-0 start-100 translate-middle p-2 border border-light rounded-circle bg-${
                              isConnected ? "success" : "danger"
                            }`}
                          >
                            <div className="visually-hidden">
                              {isConnected ? "online" : "offline"}
                            </div>
                          </span>
                        )}
                    </span>
                  )}
                {$joinedMatch.value?.playerID === `${id}` && !!name && (
                  <LeaveMatchButton
                    {...{ gameName, matchID, $joinedMatch }}
                  />
                )}
                {!$joinedMatch.value?.playerID && !name && (
                  <JoinMatchButton
                    {...{
                      gameName,
                      matchID,
                      playerID: `${id}`,
                      $joinedMatch,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
