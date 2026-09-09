import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { recordActivity } from "@/lib/admin";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/signup")({ component: SignUp });

function SignUp() {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  if (user) return <Navigate to="/dashboard" />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!agreed) {
      setError("Please acknowledge the beta testing agreement.");
      setLoading(false);
      return;
    }
    const { error: err } = await authClient.signUp.email({
      email: email.trim(),
      password,
      name: name.trim(),
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Could not create account.");
      return;
    }
    try {
      localStorage.setItem("studious-show-tutorial", "1");
    } catch {
      /* ignore */
    }
    try {
      await recordActivity({ data: { action: "signup" } });
    } catch {
      /* ignore */
    }
    await navigate({ to: "/profile" });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-dark px-4 py-10">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <img src="/logo.png" alt="Studious AI" className="h-10 w-auto" />
          <p className="mt-1 text-xs text-muted">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Full name" type="text" value={name} onChange={setName} autoComplete="name" />
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <div>
            <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
            <p className="mt-1 text-[10px] text-muted">At least 8 characters</p>
          </div>
          <label className="flex items-start gap-2 rounded-lg border border-border bg-bg px-3 py-2.5 text-[11px] leading-snug text-muted">
            <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I understand Studious AI is a <strong className="text-fg">beta site for testing</strong>. Features may
              change, and generated study tools are for learning support — not a substitute for your own work or official
              school materials.
            </span>
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{error}</p>}
          <Button type="submit" className="mt-2 w-full" disabled={loading || password.length < 8 || !agreed}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-teal hover:underline">
            Sign in
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
        minLength={type === "password" ? 8 : undefined}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-fg outline-none focus:border-teal"
      />
    </div>
  );
}
