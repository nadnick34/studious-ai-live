/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker).
 *
 * Off by default. To enable: set `emailAndPasswordEnabled` to `true` below,
 * then build sign-up / sign-in forms with `authClient.signUp.email` /
 * `authClient.signIn.email` from `@/lib/auth/client` (see the auth skill).
 *
 * Password reset emails go out only when `RESEND_API_KEY` and `EMAIL_FROM`
 * are set. With either missing, sendResetPassword returns without throwing.
 */
import { passwordResetConfigured, sendPasswordResetEmail } from "@/lib/mail.server";

export const emailAndPasswordEnabled = true;

export function emailPasswordOptions() {
  if (!emailAndPasswordEnabled) return {};
  return {
    emailAndPassword: {
      enabled: true as const,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (!passwordResetConfigured()) return;
        await sendPasswordResetEmail(user.email, url);
      },
    },
  };
}
