import { Hono } from "hono";
import { prefixStorage, type Storage } from "unstorage";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "./db.ts";

const createGameSchema = z.object({});

const joinGameSchema = z.object({});

const games = new Hono()
  .use<{ Variables: { db: Storage } }>((c, next) => {
    c.set("db", prefixStorage(db, "api"));
    return next();
  })
  .get("/:name", (c) => {
    const { name } = c.req.param();
    return c.json({ message: `Hello from /games/${name}` });
  })
  .post("/:name/create", zValidator("json", createGameSchema), (c) => {
    return c.text("Hello Hono!");
  })
  .get("/:name/:id", (c) => {
    const { name, id } = c.req.param();
    return c.text(`Hello from /games/${name}/${id}`);
  })
  .post("/:name/:id/join", zValidator("json", joinGameSchema), (c) => {
    return c.text("Hello Hono!");
  });

export default games;
