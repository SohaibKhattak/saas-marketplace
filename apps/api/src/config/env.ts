import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().url(),
  SUPABASE_USER: z.string(),
  SUPABASE_HOST: z.string(),
  SUPABASE_DATABASE_NAME: z.string(),
  SUPABASE_DATABASE_PASSWORD: z.string(),
  SUPABASE_PORT: z.coerce.number().default(5432),
  SUPABASE_SSL_REJECT_UNAUTHORIZED: z
    .string()
    .transform((v) => v === "true")
    .default("true"),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // Email
  SMTP_HOST: z.string().default("smtp.mailtrap.io"),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Saasifyy <noreply@saasifyy.com>"),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().startsWith("re_").optional(),

  // Supabase Storage (optional — only needed for file uploads)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // WordPress Multisite
  WP_CLI_PATH: z.string().default("/usr/local/bin/wp"),
  WP_SITE_URL: z.string().url().default("http://localhost:8080"),

  // Frontend URL (for CORS and email links)
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Platform config
  PLATFORM_FEE_PERCENT: z.coerce.number().default(15),
  MIN_PAYOUT_AMOUNT: z.coerce.number().default(50),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
