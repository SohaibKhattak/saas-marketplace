import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);
const FROM_EMAIL = `Saasifyy <noreply@${new URL(env.FRONTEND_URL).hostname}>`;

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Verify your Saasifyy account",
    html: `
      <h2>Welcome to Saasifyy!</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a></p>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Reset your Saasifyy password",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click below to set a new password:</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
}
