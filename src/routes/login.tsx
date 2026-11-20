import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { recordActivity } from "@/lib/admin";
import { clearProfileCache, fetchProfileShared } from "@/lib/profile-cache";
import { passwordResetAvailable } from "@/lib/password-reset";
import { brandFromProfile, hydrateBrand, persistBrand } from "@/lib/schools";
import { RoleHomeRedirect } from "@/components/role-home-redirect";
import { playTheme } from "@/lib/theme-audio";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    void passwordResetAvailable()
      .then((ok) => setCanReset(Boolean(ok)))
      .catch(() => setCanReset(false));
  }, []);

  if (user) return <RoleHomeRedirect />;

  async function homeForRole(profile: { role?: string | null; isAdmin?: boolean }) {
    if (profile.isAdmin) return "/admin";
    if (profile.role === "teacher") return "/teacher";
    if (profile.role === "professional") return "/meetings";
    return "/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const loginEmail = email.trim();
    const { error: err } = await authClient.signIn.email({ email: loginEmail, password });
    setLoading(false);
    if (err) {
      setError(err.message || "Invalid email or password.");
      return;
    }
    let dest = "/dashboard";
    try {
      clearProfileCache();
      const p = await fetchProfileShared(true);
      const brand = brandFromProfile(p);
      if (brand) persistBrand(brand);
      else hydrateBrand();
      dest = await homeForRole(p);
    } catch {
      hydrateBrand();
    }
    try {
      await recordActivity({ data: { action: "login" } });
    } catch {
      /* ignore */
    }
    playTheme({ loop: false, volume: 0.38 });
    await navigate({ to: dest as any });
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            trailing={
              <button type="button" className="text-xs font-medium text-teal" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />
          {canReset && (
            <p className="text-right">
              <Link to="/forgot-password" className="text-xs font-medium text-teal hover:underline">
                Forgot password?
              </Link>
            </p>
          )}
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
  trailing,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-muted">
          {label}
        </label>
        {trailing}
      </div>
      <input
        id={id}
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
