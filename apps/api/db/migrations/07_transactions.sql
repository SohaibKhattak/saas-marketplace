-- 07_transactions.sql

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    developer_id UUID NOT NULL REFERENCES developer_profiles(id),
    stripe_payment_intent_id TEXT,
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    platform_fee DOUBLE PRECISION NOT NULL,
    developer_amount DOUBLE PRECISION NOT NULL,
    status "TransactionStatus" NOT NULL DEFAULT 'SUCCEEDED',
    type "TransactionType" NOT NULL DEFAULT 'PAYMENT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
-- CREATE INDEX idx_transactions_developer_id ON transactions(developer_id);
-- CREATE INDEX idx_transactions_created_at ON transactions(created_at);
-- CREATE INDEX idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.transactions TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'transactions') THEN
        CREATE POLICY "Service Role full access" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'transactions') THEN
        CREATE POLICY "Users can manage their own rows" ON public.transactions FOR ALL TO authenticated USING (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid())) WITH CHECK (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid()));
    END IF;
END $$;
