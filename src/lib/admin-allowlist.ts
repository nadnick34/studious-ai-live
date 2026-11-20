/**
 * Pure admin-allowlist parsing. No env access and no secrets.
 * The server reads `ADMIN_EMAILS` in `admin-allowlist.server.ts`.
 */

/** Parse a comma-separated email list. Blank input yields an empty set. */
export function parseAdminEmails(raw: string | null | undefined): ReadonlySet<string> {
  const emails = new Set<string>();
  if (!raw) return emails;
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (email) emails.add(email);
  }
  return emails;
}

export function emailIsAllowlistedAdmin(
  email: string | null | undefined,
  allowlist: ReadonlySet<string>,
): boolean {
  if (!email) return false;
  return allowlist.has(email.trim().toLowerCase());
}
