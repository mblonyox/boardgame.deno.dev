import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <hgroup className="text-center">
        <h2>🎲Boardgame!</h2>
        <p>
          <strong className="text-nowrap">🎲Boardgame!</strong>{" "}
          - the digital home for board game lovers everywhere!
        </p>
      </hgroup>
      <p>
        Ready to roll the dice, draw some cards, and challenge your friends (or
        make new ones)? You've just stepped into your new favorite spot for
        playing board games online - anytime, anywhere.
      </p>
      <p>
        Whether you're a fan of strategy games, party games, or classic
        favorites, we've got something for everyone. No setup, no cleanup - just
        pure board game fun at your fingertips.
      </p>
      <ul>
        <li>
          🧩 Play with friends or match with players worldwide
        </li>
        <li>
          🎮 Easy-to-use interface and real-time multiplayer
        </li>
        <li>
          🏆 Tournaments, leaderboards, and community events
        </li>
      </ul>
      <p>Let the games begin!</p>
    </>
  );
}
