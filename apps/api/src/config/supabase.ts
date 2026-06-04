import { createClient } from "@supabase/supabase-js";

/**
 * Shared service-role Supabase client for **data operations only**.
 *
 * ⚠️  NEVER call session-setting auth methods (signInWithPassword, signUp,
 *     signInWithOAuth) on this client — doing so contaminates its in-memory
 *     session and causes subsequent PostgREST queries to run under a user
 *     token instead of the service_role key, which activates RLS filtering
 *     and intermittently hides rows belonging to other users.
 *
 * For auth operations that set a session, use {@link createAuthClient} instead.
 */
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

/**
 * Creates a **fresh, ephemeral** Supabase client for auth operations that
 * set a session (signInWithPassword, signUp, signInWithOAuth, etc.).
 *
 * Each call returns a brand-new client so the shared {@link supabase}
 * singleton is never contaminated with a user session.
 */
export function createAuthClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}