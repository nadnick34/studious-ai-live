import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { passwordResetAvailable } from "@/lib/password-reset";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void passwordResetAvailable()
      .then((ok) => setReady(Boolean(ok)))
      .catch(() => setReady(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Could not send a reset link.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-dark px-4 py-10">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <Link to="/">
            <img src="/logo.png" alt="Studious AI" width={247} height={77} className="h-[77px] w-auto max-w-full" />
          </Link>
          <h1 className="mt-3 text-base font-semibold text-fg">Reset your password</h1>
          <p className="mt-1 text-center text-sm text-muted">
            Enter the email you signed up with. We’ll send a link that lets you choose a new password.
          </p>
        </div>
        {ready === false && (
          <p className="rounded-lg bg-bg px-3 py-2 text-sm text-muted">
            Password reset is not available on this site yet. Ask the person who runs Studious to turn on email.
          </p>
        )}
        {ready && !sent && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
                Email
              </label>
              <input
                id={id}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        {sent && (
          <p className="rounded-lg bg-bg px-3 py-2 text-sm text-fg">
            If that email has an account, a link is on its way. It expires in an hour.
          </p>
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
