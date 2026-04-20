import * as nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
});

const FROM_EMAIL = env.SMTP_FROM || `Saasifyy <noreply@${new URL(env.FRONTEND_URL).hostname}>`;

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:32px;background-color:#fafafa;">
      <div style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 4px 12px rgba(0,0,0,0.05);text-align:center;">
        <h2 style="color:#111827;font-size:24px;margin-bottom:16px;">Welcome to Saasifyy!</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.5;margin-bottom:32px;">Click the link below to verify your email address and get started:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;transition:background-color 0.2s;">Verify Email</a>
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;">
          <p style="color:#9ca3af;font-size:14px;margin-bottom:8px;">Or copy and paste this link into your browser:</p>
          <p style="color:#7c3aed;font-size:14px;word-break:break-all;"><a href="${verifyUrl}" style="color:#7c3aed;text-decoration:none;">${verifyUrl}</a></p>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">This link will expire in 24 hours.</p>
    </div>
  `;

  // --- Nodemailer Implementation ---
  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: "Verify your Saasifyy account",
    html: htmlContent,
  });

  /*
  // --- Resend Implementation ---
  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your Saasifyy account",
      html: htmlContent,
    });
  }
  */
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const htmlContent = `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:32px;background-color:#fafafa;">
      <div style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 4px 12px rgba(0,0,0,0.05);text-align:center;">
        <h2 style="color:#111827;font-size:24px;margin-bottom:16px;">Password Reset Request</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.5;margin-bottom:32px;">We received a request to reset your password. Click the button below to choose a new one:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;transition:background-color 0.2s;">Reset Password</a>
        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;">
          <p style="color:#9ca3af;font-size:14px;margin-bottom:8px;">Or copy and paste this link into your browser:</p>
          <p style="color:#7c3aed;font-size:14px;word-break:break-all;"><a href="${resetUrl}" style="color:#7c3aed;text-decoration:none;">${resetUrl}</a></p>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
  `;

  // --- Nodemailer Implementation ---
  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: "Reset your Saasifyy password",
    html: htmlContent,
  });

  /*
  // --- Resend Implementation ---
  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your Saasifyy password",
      html: htmlContent,
    });
  }
  */
}

export async function sendNewSubscriptionEmail(
  developerEmail: string,
  data: { customerName: string; productName: string; planName: string; amount: number; billingCycle: string }
) {
  const dashboardUrl = `${env.FRONTEND_URL}/developer/products`;

  const htmlContent = `
    <h2>You have a new subscriber! 🎉</h2>
    <p><strong>${data.customerName}</strong> just subscribed to <strong>${data.productName}</strong>.</p>
    <table style="margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Plan</td><td style="padding:4px 0;"><strong>${data.planName}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount</td><td style="padding:4px 0;"><strong>$${data.amount}/${data.billingCycle === "YEARLY" ? "year" : "month"}</strong></td></tr>
    </table>
    <p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">View Dashboard</a></p>
  `;

  // --- Nodemailer Implementation ---
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: developerEmail,
    subject: `New subscriber for ${data.productName}!`,
    html: htmlContent,
  });

  /*
  // --- Resend Implementation ---
  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: developerEmail,
      subject: \`New subscriber for \${data.productName}!\`,
      html: htmlContent,
    });
  }
  */
}

export async function sendSubscriptionConfirmationEmail(
  customerEmail: string,
  data: { productName: string; planName: string; amount: number; billingCycle: string }
) {
  const subsUrl = `${env.FRONTEND_URL}/customer/subscriptions`;

  const htmlContent = `
    <h2>Subscription Confirmed ✅</h2>
    <p>You're now subscribed to <strong>${data.productName}</strong>.</p>
    <table style="margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Plan</td><td style="padding:4px 0;"><strong>${data.planName}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;">Amount</td><td style="padding:4px 0;"><strong>$${data.amount}/${data.billingCycle === "YEARLY" ? "year" : "month"}</strong></td></tr>
    </table>
    <p><a href="${subsUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Manage Subscriptions</a></p>
  `;

  // --- Nodemailer Implementation ---
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `Subscription confirmed — ${data.productName}`,
    html: htmlContent,
  });

  /*
  // --- Resend Implementation ---
  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: \`Subscription confirmed — \${data.productName}\`,
      html: htmlContent,
    });
  }
  */
}
