import { JSX } from "preact/jsx-runtime";

export default function LoadingSpinner({ className }: JSX.HTMLAttributes) {
  return (
    <div
      className={"w-100 h-100 d-flex justify-content-center align-items-center " +
        className}
    >
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
