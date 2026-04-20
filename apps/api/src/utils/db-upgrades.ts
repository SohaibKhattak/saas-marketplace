import { pool } from "../config/database.js";

let hasEnsuredUsersAuthColumns = false;
let ensureInFlight: Promise<void> | null = null;

export async function ensureUsersAuthColumns(): Promise<void> {
  if (hasEnsuredUsersAuthColumns) return;
  if (ensureInFlight) return ensureInFlight;

  ensureInFlight = (async () => {
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'users'
        ) THEN
          ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT false;

          ALTER TABLE public.users
            ADD COLUMN IF NOT EXISTS auth_provider TEXT;

          UPDATE public.users
            SET auth_provider = 'PASSWORD'
            WHERE auth_provider IS NULL;

          ALTER TABLE public.users
            ALTER COLUMN auth_provider SET DEFAULT 'PASSWORD';

          ALTER TABLE public.users
            ALTER COLUMN auth_provider SET NOT NULL;

          BEGIN
            ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;
          EXCEPTION WHEN others THEN
            NULL;
          END;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'users_auth_provider_check'
          ) THEN
            ALTER TABLE public.users
              ADD CONSTRAINT users_auth_provider_check
              CHECK (auth_provider IN ('PASSWORD', 'GOOGLE'));
          END IF;
        END IF;
      END
      $$;
    `);

    hasEnsuredUsersAuthColumns = true;
  })();

  try {
    await ensureInFlight;
  } finally {
    ensureInFlight = null;
  }
}
