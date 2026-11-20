/** Server-only. True when a reset email can actually be sent. */
export function passwordResetConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    console.warn("[mail] RESEND_API_KEY or EMAIL_FROM is unset; password reset email was not sent.");
    return;
  }
  const safeUrl = url.replace(/"/g, "%22");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Studious AI password",
      html: `<p>Reset your Studious AI password by opening this link:</p><p><a href="${safeUrl}">Choose a new password</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) {
    throw new Error("Could not send the password reset email.");
  }
}
