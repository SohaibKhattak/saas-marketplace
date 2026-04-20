-- 08_payouts.sql

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES developer_profiles(id),
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    stripe_transfer_id TEXT,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_developer_id ON payouts(developer_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.payouts TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for service_role to bypass RLS if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'payouts') THEN
        CREATE POLICY "Service Role full access" ON public.payouts FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own rows' AND tablename = 'payouts') THEN
        CREATE POLICY "Users can manage their own rows" ON public.payouts FOR ALL TO authenticated USING (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid())) WITH CHECK (developer_id IN (SELECT id FROM developer_profiles WHERE user_id = auth.uid()));
    END IF;
END $$;
