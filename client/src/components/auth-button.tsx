import { useSession } from "@hono/auth-js/react";
import { Link } from "@tanstack/react-router";

export default function AuthButton() {
  const { data, status } = useSession();

  if (status === "unauthenticated" || !data?.user) {
    return <Link to="/sign-in" className="outline" role="button">Sign In</Link>;
  }

  return (
    <details className="dropdown">
      <summary>Account</summary>
      <ul>
        <li>{data.user.name}</li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
        <li>
          <Link to="/settings">Settings</Link>
        </li>
        <li>
          <Link to="/sign-out">Sign Out</Link>
        </li>
      </ul>
    </details>
  );
}
