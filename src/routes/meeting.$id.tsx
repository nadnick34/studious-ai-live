import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/meeting/$id")({
  component: () => <Outlet />,
});
