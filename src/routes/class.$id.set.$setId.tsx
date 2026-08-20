import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/class/$id/set/$setId")({
  component: () => <Outlet />,
});
