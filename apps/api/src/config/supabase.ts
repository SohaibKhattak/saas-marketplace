import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // MUST be this
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);