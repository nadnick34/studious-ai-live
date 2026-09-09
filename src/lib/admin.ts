import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const ADMIN_EMAIL = "admin@getstudious.ai";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin123";

export function resolveLoginEmail(raw: string) {
  const v = raw.trim().toLowerCase();
  if (v === ADMIN_USERNAME || v === ADMIN_EMAIL) return ADMIN_EMAIL;
  return raw.trim();
}

async function ensureLogTable() {
  const sql = await getSql();
  await sql.query(`
    create table if not exists activity_log (
      id text primary key,
      user_id text,
      email text,
      action text not null,
      detail text,
      created_at timestamptz not null default now()
    )
  `);
  return sql;
}

export const seedAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const sql = await ensureLogTable();
    const rows = await sql<{ id: string }>`
      select id from "user" where lower(email) = ${ADMIN_EMAIL} limit 1
    `;
    const id = rows[0]?.id;
    if (!id) return { ok: true as const, created: false };
    await sql.query(
      `insert into profiles (user_id, display_name, role, edition, setup_complete, updated_at)
       values ($1, 'Admin', 'admin', 'student', true, now())
       on conflict (user_id) do update set role = 'admin', updated_at = now()`,
      [id],
    );
    return { ok: true as const, created: true };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "seed failed" };
  }
});

export const recordActivity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { action: string; detail?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await ensureLogTable();
    const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const who = await sql<{ email: string }>`select email from "user" where id = ${context.userId} limit 1`;
    await sql.query(
      `insert into activity_log (id, user_id, email, action, detail) values ($1,$2,$3,$4,$5)`,
      [id, context.userId, who[0]?.email || null, data.action, data.detail || null],
    );
    return { ok: true as const };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ensureLogTable();
    const me = await sql<{ email: string }>`select email from "user" where id = ${context.userId} limit 1`;
    const profile = await sql<{ role: string | null }>`select role from profiles where user_id = ${context.userId} limit 1`;
    const allowed =
      me[0]?.email?.toLowerCase() === ADMIN_EMAIL || profile[0]?.role === "admin";
    if (!allowed) throw new Error("Admin only");

    const users = await sql<{
      id: string;
      name: string;
      email: string;
      createdAt: string;
      role: string | null;
      last_seen: string | null;
      classes: number | string | null;
      sets: number | string | null;
    }>`
      select
        u.id,
        u.name,
        u.email,
        u."createdAt",
        p.role,
        (
          select max(s."updatedAt") from session s where s."userId" = u.id
        ) as last_seen,
        (select count(*) from classes c where c.user_id = u.id) as classes,
        (select count(*) from study_sets ss where ss.user_id = u.id) as sets
      from "user" u
      left join profiles p on p.user_id = u.id
      order by u."createdAt" desc
    `;

    const activity = await sql<{
      id: string;
      email: string | null;
      action: string;
      detail: string | null;
      created_at: string;
    }>`
      select id, email, action, detail, created_at
      from activity_log
      order by created_at desc
      limit 80
    `;

    const sessions = await sql<{
      email: string;
      createdAt: string;
      updatedAt: string;
      ipAddress: string | null;
    }>`
      select u.email, s."createdAt", s."updatedAt", s."ipAddress"
      from session s
      join "user" u on u.id = s."userId"
      order by s."updatedAt" desc
      limit 40
    `;

    return { users, activity, sessions };
  });
