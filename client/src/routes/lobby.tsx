import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/lobby")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <hgroup className="text-center">
        <h1>Lobby</h1>
        <p>One lobby, infinite strategies.</p>
      </hgroup>
      <hr />
    </>
  );
}
