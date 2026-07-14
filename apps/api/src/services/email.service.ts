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

function buildEmailTemplate(title: string, bodyHtml: string, actionButton?: { text: string; url: string }) {
  // Placeholder URL for logo in the bucket. Update this with actual URL once deployed.
  const logoUrl = "https://aliayutkvrtygkzdtoud.supabase.co/storage/v1/object/public/avatars/avatars/logo%20(3).png";
  const year = new Date().getFullYear();

  return `
    <div style="font-family:'Inter', 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;padding:32px;background-color:#fafafa;">
      <div style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="display:flex;align-items:center;margin-bottom:32px;border-bottom:1px solid #f3f4f6;padding-bottom:24px;">
          <img src="${logoUrl}" alt="Saasify Logo" style="height:32px;width:auto;margin-right:12px;" />
          <span style="font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">Saasify</span>
        </div>

        <!-- Title -->
        <h2 style="color:#111827;font-size:24px;margin-bottom:24px;font-weight:600;">${title}</h2>
        
        <!-- Body -->
        <div style="color:#4b5563;font-size:16px;line-height:1.6;margin-bottom:32px;">
          ${bodyHtml}
        </div>

        <!-- Action Button -->
        ${actionButton ? `
          <div style="text-align:center;margin:32px 0;">
            <a href="${actionButton.url}" style="display:inline-block;padding:14px 32px;background-color:#000000;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;transition:opacity 0.2s;">
              ${actionButton.text}
            </a>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top:40px;padding-top:24px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="color:#9ca3af;font-size:13px;margin-bottom:8px;">
            Saasify Inc. &copy; ${year}. All rights reserved.
          </p>
          <p style="color:#9ca3af;font-size:13px;margin-bottom:16px;">
            123 Tech Lane, San Francisco, CA 94105
          </p>
          <div style="color:#9ca3af;font-size:12px;">
            <a href="${env.FRONTEND_URL}/privacy" style="color:#6b7280;text-decoration:underline;margin:0 8px;">Privacy Policy</a> | 
            <a href="${env.FRONTEND_URL}/terms" style="color:#6b7280;text-decoration:underline;margin:0 8px;">Terms of Service</a> | 
            <a href="#" style="color:#6b7280;text-decoration:underline;margin:0 8px;">Unsubscribe</a>
          </div>
        </div>
        
      </div>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const htmlContent = buildEmailTemplate(
    "Verify your email address",
    `
      <p style="margin-bottom:16px;">Welcome to Saasify! We are excited to have you on board.</p>
      <p style="margin-bottom:16px;">To complete your registration and ensure the security of your account, please verify your email address by clicking the button below.</p>
      <p style="margin-top:32px;font-size:14px;color:#6b7280;">If the button does not work, you can copy and paste the following link into your browser:</p>
      <p style="font-size:14px;word-break:break-all;color:#000000;"><a href="${verifyUrl}" style="color:#000000;">${verifyUrl}</a></p>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;">This verification link will expire in 24 hours.</p>
    `,
    { text: "Verify Email", url: verifyUrl }
  );

  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your Saasify account",
      html: htmlContent,
    });
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const htmlContent = buildEmailTemplate(
    "Password Reset Request",
    `
      <p style="margin-bottom:16px;">We received a request to reset the password associated with your Saasify account.</p>
      <p style="margin-bottom:16px;">If you initiated this request, please click the button below to choose a new password.</p>
      <p style="margin-top:32px;font-size:14px;color:#6b7280;">Alternatively, copy and paste this link into your browser:</p>
      <p style="font-size:14px;word-break:break-all;color:#000000;"><a href="${resetUrl}" style="color:#000000;">${resetUrl}</a></p>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email or contact our support team if you have concerns.</p>
    `,
    { text: "Reset Password", url: resetUrl }
  );

  if (resend) {
    const res = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your Saasify password",
      html: htmlContent,
    });
    console.log("email resp: ", res);
  }
}

export async function sendNewSubscriptionEmail(
  developerEmail: string,
  data: { customerName: string; productName: string; planName: string; amount: number; billingCycle: string }
) {
  const dashboardUrl = `${env.FRONTEND_URL}/developer/products`;

  const htmlContent = buildEmailTemplate(
    "New Subscription Alert",
    `
      <p style="margin-bottom:16px;"><strong>${data.customerName}</strong> has just subscribed to your product, <strong>${data.productName}</strong>.</p>
      <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:24px 0;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">Plan Selected</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;">${data.planName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">Subscription Amount</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;">$${data.amount} / ${data.billingCycle === "YEARLY" ? "year" : "month"}</td>
          </tr>
        </table>
      </div>
      <p style="margin-bottom:16px;">You can view and manage your product performance metrics directly from your developer dashboard.</p>
    `,
    { text: "View Dashboard", url: dashboardUrl }
  );

  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: developerEmail,
      subject: `New subscription for ${data.productName}`,
      html: htmlContent,
    });
  }
}

export async function sendSubscriptionConfirmationEmail(
  customerEmail: string,
  data: { productName: string; planName: string; amount: number; billingCycle: string }
) {
  const subsUrl = `${env.FRONTEND_URL}/customer/subscriptions`;

  const htmlContent = buildEmailTemplate(
    "Subscription Confirmed",
    `
      <p style="margin-bottom:16px;">Thank you for your purchase. You are now successfully subscribed to <strong>${data.productName}</strong>.</p>
      <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:24px 0;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">Plan Details</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;">${data.planName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;width:40%;">Billing Cycle Amount</td>
            <td style="padding:8px 0;color:#111827;font-weight:500;">$${data.amount} / ${data.billingCycle === "YEARLY" ? "year" : "month"}</td>
          </tr>
        </table>
      </div>
      <p style="margin-bottom:16px;">You can manage your subscription settings and billing details from your customer dashboard.</p>
    `,
    { text: "Manage Subscriptions", url: subsUrl }
  );

  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Subscription confirmed — ${data.productName}`,
      html: htmlContent,
    });
  }
}
