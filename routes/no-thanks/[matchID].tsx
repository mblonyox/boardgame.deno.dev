import { defineRoute } from "$fresh/server.ts";
import NoThanksClient from "~/islands/NoThanksClient.tsx";

const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

export default defineRoute((_req, ctx) => {
  const matchID = ctx.params.matchID;
  const debug = !isDenoDeploy;
  return <NoThanksClient {...{ matchID, debug }} />;
});
