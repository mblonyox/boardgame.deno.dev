import { RouterProvider } from "@tanstack/react-router";
import { useSession } from "@hono/auth-js/react";

import { router } from "./router.tsx";

export default function App() {
  const session = useSession();

  return <RouterProvider router={router} context={{ session }} />;
}
