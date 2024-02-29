import { LobbyClient } from "boardgame.io/client";
import { useSignal } from "@preact/signals";
import {
  adjectives,
  animals,
  colors,
  names,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { IS_BROWSER } from "$fresh/runtime.ts";

const getPlayerName = () =>
  IS_BROWSER && localStorage.getItem("playerName") ||
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors, names],
    length: 2,
    separator: "-",
  });

type Props = {
  gameName: string;
};

export default function ({ gameName }: Props) {
  const isPending = useSignal(false);
  const playerName = useSignal(getPlayerName());
  const numPlayers = useSignal(3);

  const onCreateMatchSubmit = async () => {
    isPending.value = true;
    const client = new LobbyClient({ server: "/api" });
    const { matchID } = await client.createMatch(gameName, {
      numPlayers: numPlayers.value,
    });
    const joinedMatch = await client.joinMatch(
      gameName,
      matchID,
      {
        playerName: playerName.value,
        playerID: "0",
      },
    );
    localStorage.setItem(
      `match:${matchID}`,
      JSON.stringify(joinedMatch),
    );
    document.location.assign(`/${gameName}/${matchID}`);
    isPending.value = false;
  };

  return (
    <>
      <button
        className="btn btn-outline-primary"
        data-bs-toggle="modal"
        data-bs-target="#createMatchModal"
      >
        Create Match
      </button>
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
                    onChange={(e) => playerName.value = e.currentTarget.value}
                    readOnly={isPending.value}
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
                      numPlayers.value = parseInt(e.currentTarget.value)}
                    readOnly={isPending.value}
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
                {isPending.value
                  ? (
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  )
                  : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
