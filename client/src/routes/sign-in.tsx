import { createFileRoute, redirect } from "@tanstack/react-router";
import { RiFacebookFill, RiGoogleFill } from "@remixicon/react";

import CredentialsForm from "../components/sign-in-form.tsx";
import { signIn } from "@hono/auth-js/react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: RouteComponent,
  beforeLoad: ({ context: { session } }) => {
    if (session?.status === "authenticated") {
      throw redirect({ to: "/profile" });
    }
  },
});

function RouteComponent() {
  return (
    <div className="row align-center">
      <div className="col-12 col-lg-7">
        <hgroup>
          <h2>Sign In</h2>
          <p>Please sign in using your credential.</p>
        </hgroup>
        <CredentialsForm onSuccess={() => redirect({ to: "/" })} />
      </div>
      <div className="col-lg-1 border-start border-opacity-50 h-100">
      </div>
      <div className="col-12 col-lg-4">
        <p className="text-center">
          Don't have account yet? <Link to="/signup">Sign Up</Link>
        </p>
        <hr />
        <div className="row">
          <button
            type="button"
            className="outline col-12"
            onClick={() => signIn("google")}
          >
            <RiGoogleFill className="me-2" />
            Sign in with Google
          </button>
          <button
            type="button"
            className="outline col-12"
            onClick={() => signIn("facebook")}
          >
            <RiFacebookFill className="me-2" />
            Sign in with Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
