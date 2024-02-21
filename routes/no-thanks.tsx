import { defineRoute } from "$fresh/server.ts";
import NoThanksClient from "~/islands/no-thanks-client.tsx";

export default defineRoute(() => {
  return <NoThanksClient />;
});
