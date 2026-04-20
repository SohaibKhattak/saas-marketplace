import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
  throw new Error("Supabase configuration error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables.");
}

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
