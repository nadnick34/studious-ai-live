import { createServerFn } from "@tanstack/react-start";

/** Whether the login page should offer password reset. Never exposes the key. */
export const passwordResetAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { passwordResetConfigured } = await import("@/lib/mail.server");
  return passwordResetConfigured();
});
