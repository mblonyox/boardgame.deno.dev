import { Master } from "boardgame.io/master";
import { Server } from "boardgame.io";
import { nanoid } from "nanoid";

export type Auth = NonNullable<Master["auth"]>;

const authenticate = (
  actionCredentials: string,
  playerMetadata: Server.PlayerMetadata,
) => {
  if (!actionCredentials) return false;
  if (!playerMetadata) return false;
  return actionCredentials === playerMetadata.credentials;
};

export const defaultAuth = {
  generateCredentials: () => nanoid(),
  authenticateCredentials(
    { playerID, credentials, metadata }: {
      playerID: string;
      credentials: string | undefined;
      metadata: Server.MatchData;
    },
  ): boolean | Promise<boolean> {
    const hasCredentials = Object.values(metadata.players).some((p) =>
      !!p.credentials
    );
    const playerMetadata = metadata.players[playerID as unknown as number];
    return hasCredentials
      ? !!credentials && !!playerMetadata &&
        authenticate(credentials, playerMetadata)
      : true;
  },
} as unknown as Auth;
