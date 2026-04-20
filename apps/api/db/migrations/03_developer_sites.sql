-- 03_developer_sites.sql

CREATE TABLE developer_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
    wp_site_id INTEGER,
    subdomain TEXT UNIQUE NOT NULL,
    site_url TEXT,
    status "SiteStatus" NOT NULL DEFAULT 'PROVISIONING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.developer_sites TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.developer_sites ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'developer_sites') THEN
        CREATE POLICY "Service Role full access" ON public.developer_sites FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'developer_sites') THEN
        CREATE POLICY "Users can manage their own rows" ON public.developer_sites FOR ALL TO authenticated USING (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid())) WITH CHECK (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid()));
    END IF;
END $$;
