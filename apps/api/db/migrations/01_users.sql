-- Create or update the users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY, -- Maps to auth.users in Supabase
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role "UserRole" DEFAULT 'CUSTOMER',
      auth_provider TEXT NOT NULL DEFAULT 'PASSWORD' CONSTRAINT users_auth_provider_check CHECK (auth_provider IN ('PASSWORD', 'GOOGLE')),
      avatar_url TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      is_suspended BOOLEAN NOT NULL DEFAULT false,
      profile_complete BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  END IF;
  -- Make sure new columns/changes exist
  BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN END;
  BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
  EXCEPTION WHEN duplicate_column THEN END;
  BEGIN
    UPDATE users SET auth_provider = 'PASSWORD' WHERE auth_provider IS NULL;
  EXCEPTION WHEN others THEN END;
  BEGIN
    ALTER TABLE users ALTER COLUMN auth_provider SET DEFAULT 'PASSWORD';
  EXCEPTION WHEN others THEN END;
  BEGIN
    ALTER TABLE users ALTER COLUMN auth_provider SET NOT NULL;
  EXCEPTION WHEN others THEN END;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_auth_provider_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_auth_provider_check
      CHECK (auth_provider IN ('PASSWORD', 'GOOGLE'));
  END IF;
  BEGIN
    ALTER TABLE users ALTER COLUMN role DROP NOT NULL;
  EXCEPTION WHEN others THEN END;
END$$;

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.users TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'users') THEN
        CREATE POLICY "Service Role full access" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'users') THEN
        CREATE POLICY "Users can manage their own rows" ON public.users FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
END $$;
