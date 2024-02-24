import { Object } from "npm:ts-toolbelt";
import { LogEntry, Server, State, StorageAPI } from "boardgame.io";
import { Async } from "boardgame.io/internal";

interface InitOptions {
  path?: string;
}

export class KvStorage extends Async {
  private _kvPath?: string;
  private _kv?: Deno.Kv;

  constructor(opts?: InitOptions) {
    super();
    this._kvPath = opts?.path;
  }

  async connect() {
    this._kv = await Deno.openKv(this._kvPath);
  }

  async listMatches(
    opts?: StorageAPI.ListMatchesOpts | undefined,
  ): Promise<string[]> {
    if (!this._kv) throw new Error("KV is not connected!");

    const result: string[] = [];
    for await (const item of this._kv.list({ prefix: ["matches"] })) {
      if (item.key.at(-1) !== "metadata") continue;
      const matchID = item.key.at(1)?.toString();
      if (!matchID) continue;
      const metadata = item.value as Server.MatchData;
      if (opts?.gameName && metadata.gameName !== opts.gameName) continue;
      if (opts?.where?.isGameover && !metadata.gameover) continue;
      if (
        opts?.where?.updatedBefore &&
        metadata.updatedAt >= opts.where.updatedBefore
      ) continue;
      if (
        opts?.where?.updatedAfter &&
        metadata.updatedAt <= opts.where.updatedAfter
      ) continue;
      result.push(matchID);
    }
    return result;
  }

  async createMatch(
    matchID: string,
    opts: StorageAPI.CreateMatchOpts,
  ): Promise<void> {
    if (!this._kv) throw new Error("KV is not connected!");

    const key = InitialStateKey(matchID);
    await this._kv.set(key, opts.initialState);
    await this.setState(matchID, opts.initialState);
    await this.setMetadata(matchID, opts.metadata);
  }

  async setState(
    matchID: string,
    state: State<unknown>,
    deltalog?: LogEntry[] | undefined,
  ): Promise<void> {
    if (!this._kv) throw new Error("KV is not connected!");

    if (deltalog && deltalog.length > 0) {
      const key = LogKey(matchID);
      const log: LogEntry[] = (await this._kv.get<LogEntry[]>(key)).value ?? [];
      await this._kv.set(key, [...log, ...deltalog]);
    }
    await this._kv.set(MatchKey(matchID), state);
  }

  async setMetadata(
    matchID: string,
    metadata: Server.MatchData,
  ): Promise<void> {
    if (!this._kv) throw new Error("KV is not connected!");

    const key = MetadataKey(matchID);
    await this._kv.set(key, metadata);
  }

  async fetch<O extends StorageAPI.FetchOpts>(
    matchID: string,
    opts: O,
  ): Promise<
    Object.Pick<StorageAPI.FetchFields, Object.SelectKeys<O, true, "default">>
  > {
    if (!this._kv) throw new Error("KV is not connected!");

    const result = {} as StorageAPI.FetchFields;
    if (opts.state) {
      const key = MatchKey(matchID);
      const entry = await this._kv.get<State>(key);
      if (entry.value) {
        result.state = entry.value;
      }
    }
    if (opts.metadata) {
      const key = MetadataKey(matchID);
      const entry = await this._kv.get<Server.MatchData>(key);
      if (entry.value) {
        result.metadata = entry.value;
      }
    }
    if (opts.log) {
      const key = LogKey(matchID);
      const entry = await this._kv.get<LogEntry[]>(key);
      if (entry.value) {
        result.log = entry.value;
      }
    }
    if (opts.initialState) {
      const key = InitialStateKey(matchID);
      const entry = await this._kv.get<State>(key);
      if (entry.value) {
        result.initialState = entry.value;
      }
    }
    return (result as StorageAPI.FetchResult<O>);
  }

  async wipe(matchID: string): Promise<void> {
    if (!this._kv) throw new Error("KV is not connected!");

    await Promise.all([
      this._kv.delete(MatchKey(matchID)),
      this._kv.delete(MetadataKey(matchID)),
      this._kv.delete(InitialStateKey(matchID)),
      this._kv.delete(LogKey(matchID)),
    ]);
  }
}

function MatchKey(matchID: string) {
  return ["matches", matchID];
}

function MetadataKey(matchID: string) {
  return ["matches", matchID, "metadata"];
}

function InitialStateKey(matchID: string) {
  return ["matches", matchID, "initial"];
}

function LogKey(matchID: string) {
  return ["matches", matchID, "log"];
}
