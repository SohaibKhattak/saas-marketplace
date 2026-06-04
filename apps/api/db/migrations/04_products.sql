-- 04_products.sql (clean + production-ready)

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    developer_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    site_id UUID
        REFERENCES public.developer_sites(id) ON DELETE SET NULL,

    name TEXT NOT NULL,
    -- slug TEXT UNIQUE NOT NULL,

    -- short_description TEXT,
    description TEXT NOT NULL,

    category TEXT NOT NULL,

    -- tags TEXT[] DEFAULT '{}',
    logo_url TEXT NOT NULL,
    screenshots TEXT[] DEFAULT '{}',

    version TEXT NOT NULL DEFAULT '1.0.0',

    status "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,

    is_featured BOOLEAN NOT NULL DEFAULT false,

    avg_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_subscribers INTEGER NOT NULL DEFAULT 0,

    published_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS isDeleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;   

-- Indexes
-- CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
-- CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
-- CREATE INDEX IF NOT EXISTS idx_products_developer_id ON public.products(developer_id);
-- CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.products TO anon, authenticated, service_role;

-- Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view published products only
CREATE POLICY "Public can view published products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (status = 'PUBLISHED');

-- Developers can manage their own products
CREATE POLICY "Developers manage own products"
ON public.products
FOR ALL
TO authenticated
USING (developer_id = auth.uid())
WITH CHECK (developer_id = auth.uid());

-- Service role full access (backend / stripe / admin)
CREATE POLICY "Service role full access"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);