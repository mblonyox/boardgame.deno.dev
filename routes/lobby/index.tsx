import { defineRoute } from "$fresh/server.ts";

export default defineRoute<Record<string, unknown>>((req, ctx) => {
  const sessionData = ctx.state["session"];
  if (!sessionData) return Response.redirect(ctx.url.origin);
  return (
    <div className="container">
      <div className="col-12 col-lg-8">
        <h1>Welcome ${}!</h1>
        <p>Create or Join available rooms.</p>
      </div>
    </div>
  );
});
