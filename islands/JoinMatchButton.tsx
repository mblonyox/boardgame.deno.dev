import { IS_BROWSER } from "$fresh/runtime.ts";
import { LobbyAPI } from "boardgame.io";
import { LobbyClient } from "boardgame.io/client";
import { Signal, useSignal } from "@preact/signals";
import {
  adjectives,
  animals,
  colors,
  names,
  uniqueNamesGenerator,
} from "unique-names-generator";

const getPlayerName = () =>
  IS_BROWSER && localStorage.getItem("playerName") ||
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors, names],
    length: 2,
    separator: "-",
  });

type Props = {
  gameName: string;
  matchID: string;
  playerID: string;
  $joinedMatch: Signal<LobbyAPI.JoinedMatch | null>;
};

export default function JoinMatchButton(
  { gameName, matchID, playerID, $joinedMatch }: Props,
) {
  const $isPending = useSignal(false);
  const $playerName = useSignal(getPlayerName());

  const onJoinMatchSubmit = async () => {
    $isPending.value = true;
    const client = new LobbyClient({ server: "/api" });
    const joinedMatch = await client.joinMatch(gameName, matchID, {
      playerID,
      playerName: $playerName.value,
    });
    localStorage.setItem(
      `match:${matchID}`,
      JSON.stringify(joinedMatch),
    );
    $joinedMatch.value = joinedMatch;
    $isPending.value = false;
  };

  return (
    <>
      <button
        className="btn btn-outline-primary"
        data-bs-toggle="modal"
        data-bs-target="#joinMatchModal"
      >
        Join
      </button>
      <div
        class="modal fade"
        id="joinMatchModal"
        tabindex={-1}
        aria-labelledby="joinMatchModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="joinMatchModalLabel">
                Join Match
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
                    value={$playerName}
                    onChange={(e) => $playerName.value = e.currentTarget.value}
                    readOnly={$isPending.value}
                  />
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
                onClick={onJoinMatchSubmit}
                data-bs-dismiss="modal"
              >
                {$isPending.value
                  ? (
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  )
                  : "Join"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
