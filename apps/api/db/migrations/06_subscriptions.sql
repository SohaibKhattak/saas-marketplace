-- 06_subscriptions.sql

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id),
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

CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_product_id ON subscriptions(product_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.subscriptions TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'subscriptions') THEN
        CREATE POLICY "Service Role full access" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'subscriptions') THEN
        CREATE POLICY "Users can manage their own rows" ON public.subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
