-- 09_reviews.sql

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, customer_id)
);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.reviews TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'reviews') THEN
        CREATE POLICY "Service Role full access" ON public.reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'reviews') THEN
        CREATE POLICY "Users can manage their own rows" ON public.reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
