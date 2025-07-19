import { Hono } from "hono";
import { env } from "hono/adapter";
import { authHandler, initAuthConfig } from "@hono/auth-js";
import Credentials from "@auth/core/providers/credentials";
import Facebook from "@auth/core/providers/facebook";
import Google from "@auth/core/providers/google";
import { UnstorageAdapter } from "@auth/unstorage-adapter";
import { prefixStorage } from "unstorage";

import { db } from "./db.ts";

const store = prefixStorage(db, "auth");

const auth = new Hono().basePath("/api");

auth.use(
  "*",
  initAuthConfig((c) => ({
    secret: env(c).AUTH_SECRET,
    basePath: "/api/auth",
    pages: {
      signIn: "/sign-in",
      signOut: "/sign-out",
    },
    providers: [
      Credentials({
        credentials: {
          mode: { hidden: true },
          name: {},
          email: {},
          password: {},
          verifyPassword: {},
        },
        async authorize(credential) {
          return null;
        },
      }),
      Google,
      Facebook,
    ],
    adapter: UnstorageAdapter(store, { useItemRaw: true }),
  })),
);

auth.use("/auth/*", authHandler());

export default auth;
