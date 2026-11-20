/** Account types a signed-in user may choose for themselves. Admin is not one of them. */
export const SELF_SERVICE_ROLES = ["student", "teacher", "professional", "theologian", "both"] as const;

export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];
export type StoredEdition = "student" | "teacher" | "professional";

export function isSelfServiceRole(role: string | null | undefined): role is SelfServiceRole {
  return !!role && (SELF_SERVICE_ROLES as readonly string[]).includes(role);
}

/** Edition that matches the profile form for a self-chosen role. */
export function editionForSelfServiceRole(role: SelfServiceRole): StoredEdition {
  if (role === "teacher") return "teacher";
  if (role === "professional") return "professional";
  return "student";
}

/**
 * Role written by a profile save.
 * Client-supplied `admin` (and any other unknown role) is not applied.
 * An existing stored value is kept so the save does not rewrite it.
 */
export function roleForProfileSave(
  requested: string | null | undefined,
  existing: string | null | undefined,
): string {
  if (isSelfServiceRole(requested)) return requested;
  if (existing && existing.trim()) return existing;
  return "student";
}

export function editionForProfileSave(
  role: string,
  existingEdition: string | null | undefined,
): StoredEdition {
  if (isSelfServiceRole(role)) return editionForSelfServiceRole(role);
  if (existingEdition === "teacher" || existingEdition === "professional") return existingEdition;
  return "student";
}
