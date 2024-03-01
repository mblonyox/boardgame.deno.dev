import { LobbyAPI } from "boardgame.io";
import { LobbyClient } from "boardgame.io/client";
import { Signal, useSignal } from "@preact/signals";

type Props = {
  gameName: string;
  matchID: string;
  $joinedMatch: Signal<LobbyAPI.JoinedMatch | null>;
};

export default function LeaveMatchButton(
  { gameName, matchID, $joinedMatch }: Props,
) {
  const $isPending = useSignal(false);

  const onLeaveMatchSubmit = async () => {
    if (!$joinedMatch.value) return;
    const { playerID, playerCredentials } = $joinedMatch.value;
    $isPending.value = true;
    const client = new LobbyClient({ server: "/api" });
    await client.leaveMatch(gameName, matchID, {
      playerID,
      credentials: playerCredentials,
    });
    localStorage.removeItem(`match:${matchID}`);
    $joinedMatch.value = null;
    $isPending.value = false;
  };

  return (
    <>
      <button
        className="btn btn-outline-danger"
        data-bs-toggle="modal"
        data-bs-target="#leaveMatch"
      >
        Leave
      </button>
      <div
        class="modal fade"
        id="leaveMatch"
        tabindex={-1}
        aria-labelledby="leaveMatchLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="leaveMatchLabel">
                Leave Match
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
              <h5>Are you sure?</h5>
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
                class="btn btn-danger"
                onClick={onLeaveMatchSubmit}
                data-bs-dismiss="modal"
              >
                {$isPending.value
                  ? (
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  )
                  : "Leave"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
