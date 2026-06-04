-- 05_pricing_plans.sql (clean + production-ready)

CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES public.products(id) ON DELETE CASCADE,

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

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pricing_plans_product_id
ON public.pricing_plans(product_id);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.pricing_plans TO anon, authenticated, service_role;

-- Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing plans
CREATE POLICY "Public can view active pricing plans"
ON public.pricing_plans
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Product owners can manage pricing plans
CREATE POLICY "Product owners manage pricing plans"
ON public.pricing_plans
FOR ALL
TO authenticated
USING (
    product_id IN (
        SELECT id FROM public.products
        WHERE developer_id = auth.uid()
    )
)
WITH CHECK (
    product_id IN (
        SELECT id FROM public.products
        WHERE developer_id = auth.uid()
    )
);

-- Service role full access (backend / stripe / admin)
CREATE POLICY "Service role full access pricing plans"
ON public.pricing_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);