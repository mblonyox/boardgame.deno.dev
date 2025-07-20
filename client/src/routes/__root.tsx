import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";

import AuthButton from "../components/auth-button.tsx";
import { useSession } from "@hono/auth-js/react";

interface RouterContext {
  session: ReturnType<typeof useSession>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <header>
        <nav className="container">
          <ul>
            <li>
              <Link to="/">
                <strong className="text-nowrap">🎲Boardgame!</strong>
              </Link>
            </li>
          </ul>
          <ul>
            <li>
              <Link to="/lobby">Lobby</Link>
            </li>
            <li>
              <Link to="/games">Games</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
          <ul>
            <li>
              <AuthButton />
            </li>
          </ul>
        </nav>
        <hr />
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer>
        <hr />
        <div className="container">
          <p>
            <small>
              <strong className="text-nowrap">🎲Boardgame!</strong>{" "}
              - the digital home for board game lovers everywhere!
            </small>
          </p>
        </div>
      </footer>
    </>
  );
}
