-- 04_products.sql

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
    site_id UUID REFERENCES developer_sites(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    logo_url TEXT,
    screenshots TEXT[] DEFAULT '{}',
    version TEXT NOT NULL DEFAULT '1.0.0',
    status "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    avg_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_subscribers INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_developer_id ON products(developer_id);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.products TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'products') THEN
        CREATE POLICY "Service Role full access" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'products') THEN
        CREATE POLICY "Users can manage their own rows" ON public.products FOR ALL TO authenticated USING (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid())) WITH CHECK (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid()));
    END IF;
END $$;
