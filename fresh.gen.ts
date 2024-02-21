// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $index from "./routes/index.tsx";
import * as $lobby_index from "./routes/lobby/index.tsx";
import * as $no_thanks from "./routes/no-thanks.tsx";
import * as $no_thanks_client from "./islands/no-thanks-client.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/_middleware.ts": $_middleware,
    "./routes/index.tsx": $index,
    "./routes/lobby/index.tsx": $lobby_index,
    "./routes/no-thanks.tsx": $no_thanks,
  },
  islands: {
    "./islands/no-thanks-client.tsx": $no_thanks_client,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
