import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getAdminOverview } from "@/lib/admin";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function fmt(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function AdminPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminOverview>> | null>(null);

  useEffect(() => {
    void getAdminOverview()
      .then(setData)
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Admin only");
        window.setTimeout(() => void navigate({ to: "/dashboard" }), 1600);
      });
  }, [navigate]);

  return (
    <AppShell title="Admin">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Admin</p>
          <h2 className="text-xl font-semibold text-fg">Users and activity</h2>
          <p className="text-sm text-muted">Accounts, last session, and usage timestamps.</p>
        </div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red">{err}</p>}
        {!data && !err && <p className="text-sm text-muted">Loading…</p>}

        {data && (
          <>
            <section className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Last seen</th>
                    <th className="px-3 py-2">Classes</th>
                    <th className="px-3 py-2">Chapters</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-fg">{u.name}</td>
                      <td className="px-3 py-2 text-muted">{u.email}</td>
                      <td className="px-3 py-2 capitalize">{u.role || "student"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted">{fmt(u.createdAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted">{fmt(u.last_seen)}</td>
                      <td className="px-3 py-2">{u.classes ?? 0}</td>
                      <td className="px-3 py-2">{u.sets ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-fg">Recent sessions</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {data.sessions.length === 0 && <li>No sessions yet.</li>}
                {data.sessions.map((s, i) => (
                  <li key={`${s.email}-${i}`}>
                    {s.email} · {fmt(s.updatedAt)}
                    {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-fg">Activity log</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {data.activity.length === 0 && <li>No logged events yet. Sign-ins will appear here.</li>}
                {data.activity.map((a) => (
                  <li key={a.id}>
                    {fmt(a.created_at)} · {a.email || "unknown"} · {a.action}
                    {a.detail ? ` — ${a.detail}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
