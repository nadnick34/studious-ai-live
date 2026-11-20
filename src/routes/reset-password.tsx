import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const passwordId = useId();
  const confirmId = useId();
  const navigate = useNavigate();
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (err) {
      setError(err.message || "This reset link is invalid or expired.");
      return;
    }
    await navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-dark px-4 py-10">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="mb-2 text-center text-base font-semibold text-fg">Choose a new password</h1>
        <p className="mb-5 text-center text-sm text-muted">At least 8 characters.</p>
        {!token ? (
          <p className="rounded-lg bg-bg px-3 py-2 text-sm text-muted">
            This reset link is missing its token. Request a new one from the login page.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor={passwordId} className="mb-1 block text-xs font-medium text-muted">
                New password
              </label>
              <input
                id={passwordId}
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor={confirmId} className="mb-1 block text-xs font-medium text-muted">
                Confirm password
              </label>
              <input
                id={confirmId}
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || password.length < 8}>
              {loading ? "Saving…" : "Save password"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-teal hover:underline">
            ← Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
