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

export async function sendNewSubscriptionEmail(
  developerEmail: string,
  data: { customerName: string; productName: string; planName: string; amount: number; billingCycle: string }
) {
  const dashboardUrl = `${env.FRONTEND_URL}/developer/products`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: developerEmail,
    subject: `New subscriber for ${data.productName}!`,
    html: `
      <h2>You have a new subscriber! 🎉</h2>
      <p><strong>${data.customerName}</strong> just subscribed to <strong>${data.productName}</strong>.</p>
      <table style="margin:16px 0;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Plan</td><td style="padding:4px 0;"><strong>${data.planName}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount</td><td style="padding:4px 0;"><strong>$${data.amount}/${data.billingCycle === "YEARLY" ? "year" : "month"}</strong></td></tr>
      </table>
      <p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">View Dashboard</a></p>
    `,
  });
}

export async function sendSubscriptionConfirmationEmail(
  customerEmail: string,
  data: { productName: string; planName: string; amount: number; billingCycle: string }
) {
  const subsUrl = `${env.FRONTEND_URL}/customer/subscriptions`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `Subscription confirmed — ${data.productName}`,
    html: `
      <h2>Subscription Confirmed ✅</h2>
      <p>You're now subscribed to <strong>${data.productName}</strong>.</p>
      <table style="margin:16px 0;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Plan</td><td style="padding:4px 0;"><strong>${data.planName}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount</td><td style="padding:4px 0;"><strong>$${data.amount}/${data.billingCycle === "YEARLY" ? "year" : "month"}</strong></td></tr>
      </table>
      <p><a href="${subsUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Manage Subscriptions</a></p>
    `,
  });
}
