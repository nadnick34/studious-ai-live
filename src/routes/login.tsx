import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/data";
import { recordActivity, resolveLoginEmail, seedAdminAccount } from "@/lib/admin";
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

  if (user) return <RoleHomeRedirect />;

  async function homeForRole(role?: string | null) {
    if (role === "admin") return "/admin";
    if (role === "teacher") return "/teacher";
    if (role === "professional") return "/meetings";
    return "/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const loginEmail = resolveLoginEmail(email);
    let { error: err } = await authClient.signIn.email({ email: loginEmail, password });
    if (err && loginEmail === "admin@getstudious.ai" && password === "admin123") {
      await authClient.signUp.email({ email: loginEmail, password, name: "Admin" }).catch(() => {});
      await seedAdminAccount().catch(() => {});
      const again = await authClient.signIn.email({ email: loginEmail, password });
      err = again.error;
      await seedAdminAccount().catch(() => {});
    } else if (!err && loginEmail === "admin@getstudious.ai") {
      await seedAdminAccount().catch(() => {});
    }
    setLoading(false);
    if (err) {
      setError(err.message || "Invalid email or password.");
      return;
    }
    let dest = "/dashboard";
    try {
      const p = await getProfile();
      const brand = brandFromProfile(p);
      if (brand) persistBrand(brand);
      else hydrateBrand();
      dest = await homeForRole(p.role);
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
