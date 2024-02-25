import { FilteredMetadata } from "boardgame.io";

type Props = {
  matchData?: FilteredMetadata;
  onJoinMatch?: (playerID: string) => void;
  onLeaveMatch?: () => void;
  onToggleReady?: () => void;
};

export default function ConfirmReady(
  { matchData, onJoinMatch, onLeaveMatch }: Props,
) {
  return (
    <div className="container text-center card my-1 my-md-3">
      <div className="card-body">
        <h1>Join Match!</h1>
        <hr />
        <div className="row">
          {matchData &&
            Object.values(matchData).map(({ id, name, isConnected }) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
                <div className="card">
                  <div className="card-body justify-content-center p-1 p-md-3">
                    <div className="w-100 text-truncate">
                      {!name && <small>(empty)</small>}
                      {!!name && <strong>{name}</strong>}
                    </div>
                    <hr />
                    {!name && (
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onJoinMatch?.(`${id}`)}
                      >
                        Join
                      </button>
                    )}
                    {!!name && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onLeaveMatch?.()}
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
