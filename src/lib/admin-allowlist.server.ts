import { getSql } from "@/lib/db";
import { emailIsAllowlistedAdmin, parseAdminEmails } from "@/lib/admin-allowlist";

/**
 * Server-only admin check.
 * `ADMIN_EMAILS` is a comma-separated list of account emails.
 * When it is unset or empty, nobody is an admin.
 * Never import this module from a client component — call it from a server
 * function handler (dynamic import), same as other `*.server.ts` modules.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const raw = typeof process !== "undefined" ? process.env.ADMIN_EMAILS : undefined;
  return emailIsAllowlistedAdmin(email, parseAdminEmails(raw));
}

/** True only when this verified user id's account email is on `ADMIN_EMAILS`. */
export async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const sql = await getSql();
  const rows = await sql<{ email: string | null }>`
    select email from "user" where id = ${userId} limit 1
  `;
  return isAdminEmail(rows[0]?.email);
}
