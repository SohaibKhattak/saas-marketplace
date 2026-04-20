-- 05_pricing_plans.sql

CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_monthly DOUBLE PRECISION NOT NULL,
    price_yearly DOUBLE PRECISION,
    currency TEXT NOT NULL DEFAULT 'usd',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    trial_days INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_plans_product_id ON pricing_plans(product_id);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.pricing_plans TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'pricing_plans') THEN
        CREATE POLICY "Service Role full access" ON public.pricing_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'pricing_plans') THEN
        CREATE POLICY "Users can manage their own rows" ON public.pricing_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
