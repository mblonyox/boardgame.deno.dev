import { createFileRoute, redirect } from "@tanstack/react-router";
import { signIn } from "@hono/auth-js/react";
import { useState } from "react";
import { RiFacebookFill, RiGoogleFill } from "@remixicon/react";

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
      <div className="row align-center">
        <article className="col-12 col-lg-6">
          <form
            onSubmit={onSubmit}
            noValidate
          >
            <fieldset>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  id="email-input"
                  autoComplete="email"
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
            <input type="submit" aria-busy={isPending} />
          </form>
        </article>
        <div className="col-12 col-lg-6">
          <div className="row">
            <button type="button" className="outline col-12">
              <RiGoogleFill style={{ marginInlineEnd: "1rem" }} />
              Sign in with Google
            </button>
            <button type="button" className="outline col-12">
              <RiFacebookFill style={{ marginInlineEnd: "1rem" }} />
              Sign in with Facebook
            </button>
          </div>
        </div>
      </div>
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
