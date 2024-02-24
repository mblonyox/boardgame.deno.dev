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

export const auth = {
  generateCredentials: () => nanoid(),
  authenticateCredentials(
    { playerID, credentials, metadata }: {
      playerID: string;
      credentials: string | undefined;
      metadata: Server.MatchData;
    },
  ): boolean | Promise<boolean> {
    const playerMetadata = metadata.players[playerID as unknown as number];
    return !!credentials && !!playerMetadata &&
      authenticate(credentials, playerMetadata);
  },
} as unknown as Auth;
