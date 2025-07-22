import type { LogEntry, Server, State, StorageAPI } from "boardgame.io";
import { Async } from "boardgame.io/internal";
import { prefixStorage, type Storage } from "unstorage";

export class UnstorageDb extends Async {
  private store: Storage;
  constructor(store: Storage) {
    super();
    this.store = prefixStorage(store, "bgio");
  }

  override async connect() {}

  override async createMatch(
    matchID: string,
    opts: StorageAPI.CreateMatchOpts,
  ): Promise<void> {
    const key = InitialStateKey(matchID);

    await this.store.setItem(key, opts.initialState);
    await this.setState(matchID, opts.initialState);
    await this.setMetadata(matchID, opts.metadata);
  }

  override async setState(
    matchID: string,
    state: State,
    deltalog?: LogEntry[],
  ) {
    if (deltalog && deltalog.length > 0) {
      const key = LogKey(matchID);
      const log: LogEntry[] = ((await this.store.getItem(key)) as LogEntry[]) ||
        [];
      await this.store.setItem(key, [...log, ...deltalog]);
    }
    return await this.store.setItem(matchID, state);
  }

  override async setMetadata(
    matchID: string,
    metadata: Server.MatchData,
  ) {
    const key = MetadataKey(matchID);
    return await this.store.setItem(key, metadata);
  }

  override async fetch<O extends StorageAPI.FetchOpts>(
    matchID: string,
    opts: O,
  ): Promise<StorageAPI.FetchResult<O>> {
    const result = {} as StorageAPI.FetchFields;

    if (opts.state) {
      const state = await this.store.getItem<State>(matchID);
      if (state) result.state = state;
    }

    if (opts.metadata) {
      const key = MetadataKey(matchID);
      const metadata = await this.store.getItem<Server.MatchData>(key);
      if (metadata) result.metadata = metadata;
    }

    if (opts.log) {
      const key = LogKey(matchID);
      const log = await this.store.getItem<LogEntry[]>(key);
      if (log) result.log = log;
    }

    if (opts.initialState) {
      const key = InitialStateKey(matchID);
      const initialState = await this.store.getItem<State>(key);
      if (initialState) result.initialState = initialState;
    }

    return result as StorageAPI.FetchResult<O>;
  }

  override async wipe(matchID: string) {
    await this.store.removeItem(matchID);
    await this.store.removeItem(InitialStateKey(matchID));
    await this.store.removeItem(LogKey(matchID));
    await this.store.removeItem(MetadataKey(matchID));
  }

  override async listMatches(
    opts?: StorageAPI.ListMatchesOpts,
  ): Promise<string[]> {
    const keys = await this.store.keys();
    const suffix = ":metadata";

    const arr = await Promise.all(
      keys.map(async (k) => {
        if (!k.endsWith(suffix)) {
          return false;
        }

        const matchID = k.slice(0, k.length - suffix.length);

        if (!opts) {
          return matchID;
        }

        const game = await this.fetch(matchID, {
          state: true,
          metadata: true,
        });

        if (opts.gameName && opts.gameName !== game.metadata.gameName) {
          return false;
        }

        if (opts.where !== undefined) {
          if (typeof opts.where.isGameover !== "undefined") {
            const isGameover = typeof game.metadata.gameover !== "undefined";
            if (isGameover !== opts.where.isGameover) {
              return false;
            }
          }

          if (
            typeof opts.where.updatedBefore !== "undefined" &&
            game.metadata.updatedAt >= opts.where.updatedBefore
          ) {
            return false;
          }

          if (
            typeof opts.where.updatedAfter !== "undefined" &&
            game.metadata.updatedAt <= opts.where.updatedAfter
          ) {
            return false;
          }
        }

        return matchID;
      }),
    );

    return arr.filter((r): r is string => typeof r === "string");
  }

  async clear() {
    await this.store.clear();
  }
}

function InitialStateKey(matchID: string) {
  return `${matchID}:initial`;
}

function MetadataKey(matchID: string) {
  return `${matchID}:metadata`;
}

function LogKey(matchID: string) {
  return `${matchID}:log`;
}
