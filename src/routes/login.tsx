import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/dashboard" />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message || "Invalid email or password.");
      return;
    }
    await navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-dark px-4 py-10">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <Link to="/">
            <img src="/logo.png" alt="Studious AI" className="h-10 w-auto" />
          </Link>
          <p className="mt-1 text-xs text-muted">Your masterclass for every class.</p>
        </div>
        <h2 className="mb-5 text-center text-base font-semibold text-fg">Log in</h2>

        {authEnabled && (
          <div className="mb-4 space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => void signIn(p.providerId, { callbackURL: "/dashboard" })}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-bg"
              >
                Continue with {p.label}
              </button>
            ))}
            <div className="relative py-2 text-center text-[11px] text-muted">
              <span className="bg-card px-2">or email</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{error}</p>}
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          No account?{" "}
          <Link to="/signup" className="font-medium text-teal hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
      />
    </div>
  );
}
