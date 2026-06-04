-- 06_subscriptions.sql

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES public.products(id),

    pricing_plan_id UUID NOT NULL
        REFERENCES public.pricing_plans(id),

    stripe_subscription_id TEXT UNIQUE,

    status "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    billing_cycle "BillingCycle" NOT NULL DEFAULT 'MONTHLY',

    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id
ON public.subscriptions(customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id
ON public.subscriptions(product_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
ON public.subscriptions(status);

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.subscriptions TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Service role full access" ON public.subscriptions;
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;

-- Service role full access
CREATE POLICY "Service role full access"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can only read their own subscriptions
CREATE POLICY "Users read own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());