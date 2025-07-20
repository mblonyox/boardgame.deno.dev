import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/games")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <hgroup className="text-center">
        <h1>Games</h1>
        <p>Dive in! Your next favorite game awaits.</p>
      </hgroup>
      <hr />
      <div className="row">
      </div>
    </>
  );
}
