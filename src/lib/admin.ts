import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

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
    const { isAdminUser } = await import("@/lib/admin-allowlist.server");
    if (!(await isAdminUser(context.userId))) throw new Error("Admin only");

    const sql = await ensureLogTable();

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
