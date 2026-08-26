import { Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/data";

/** After login/session restore, send the user to the home for their saved role. */
export function RoleHomeRedirect() {
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    void getProfile()
      .then((p) => {
        if (p.role === "teacher") setTo("/teacher");
        else if (p.role === "professional") setTo("/meetings");
        else setTo("/dashboard");
      })
      .catch(() => setTo("/dashboard"));
  }, []);

  if (!to) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-sm text-muted">
        Loading your workspace…
      </div>
    );
  }

  return <Navigate to={to as "/dashboard"} />;
}
