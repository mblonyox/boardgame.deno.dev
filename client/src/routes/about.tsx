import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <hgroup className="text-center">
        <h1 className="text-center">About</h1>
        <p>Built by Players, for Players.</p>
      </hgroup>
      <p>
        We believe that great games bring people together, and we've created a
        space where you can enjoy your favorite board games online with friends,
        family, or fellow gamers from around the world. No matter where you are,
        BoardPlay makes it easy (and fun) to connect and play.
      </p>
      <h2>🧩 What We Offer:</h2>
      <ul>
        <li>
          A Growing Library of Games: From timeless classics to modern strategy
          hits - we're always expanding our collection.
        </li>
        <li>
          <strong>Multiplayer Made Simple:</strong>
          Play in real-time or take turns at your own pace. Invite friends or
          get matched with players worldwide.
        </li>
        <li>
          <strong>Community & Competition:</strong>
          Join public lobbies, enter tournaments, and climb the leaderboards.
          Whether you're a casual player or a hardcore strategist, there's a
          place for you here.
        </li>
        <li>
          <strong>Cross-Device Play:</strong>
          Enjoy seamless gaming on desktop, tablet, or mobile - no download
          required.
        </li>
      </ul>
      <h2>🎯 Our Mission</h2>
      <p>
        To make board games more accessible, social, and fun - no matter where
        you are or who you're with.
      </p>
      <h2>👥 Who We Are</h2>
      <p>
        We're a small team of game enthusiasts, designers, and developers who
        love board games just as much as you do. We built{" "}
        <strong className="text-nowrap">🎲Boardgame!</strong>{" "}
        to share that joy with the world and create a space where great gameplay
        and community thrive.
      </p>
    </>
  );
}
