import { createFileRoute, redirect } from "@tanstack/react-router";
import { signIn } from "@hono/auth-js/react";
import { useState } from "react";

export const Route = createFileRoute("/sign-in")({
  component: RouteComponent,
  beforeLoad: ({ context: { session } }) => {
    if (session?.status === "authenticated") {
      throw redirect({ to: "/profile" });
    }
  },
});

function RouteComponent() {
  const [err, setErr] = useState<string | null>();
  const isPending = err === null;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErr(null);
    signIn("credentials", {
      ...Object.fromEntries(formData.entries()),
      redirect: false,
    })
      .then((response) => {
        if (response?.error) setErr(response.error);
        else if (response?.ok) redirect({ to: "/" });
      });
  };

  return (
    <>
      <hgroup>
        <h2>Sign In</h2>
        <p>Please sign in using your credential.</p>
      </hgroup>
      <form onSubmit={onSubmit} noValidate>
        <fieldset>
          <label>
            Username:
            <input
              type="text"
              name="username"
              id="username-input"
              autoComplete="username"
              disabled={isPending}
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              name="password"
              id="password-input"
              autoComplete="current-password"
              disabled={isPending}
            />
          </label>
        </fieldset>
        <button type="submit" aria-busy={isPending}>Submit</button>
      </form>
      {err &&
        (
          <div className="row">
            <div className="col-6 offset-3 primary">
              <article>
                <p>{err}</p>
              </article>
            </div>
          </div>
        )}
    </>
  );
}
