import { createStorage, type Driver } from "unstorage";
import denoKvDriver from "unstorage/drivers/deno-kv";

export const db = createStorage({
  driver: (denoKvDriver as unknown as ({}) => Driver)({}),
});
