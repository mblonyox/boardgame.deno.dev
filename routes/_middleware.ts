import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";

export async function handler(req: Request, ctx: MiddlewareHandlerContext) {
  if (ctx.destination === "route") {
    const cookies = getCookies(req.headers);
    const sessionId = cookies["sid"];
    if (sessionId) {
      const kv = await Deno.openKv();
      const result = await kv.get(["session", sessionId]);
      const sessionData = result.value
      if (sessionData) {
        ctx.state["session"] = sessionData;
      }
    }
  }
  return ctx.next()
}