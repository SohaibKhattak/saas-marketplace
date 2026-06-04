-- 09_reviews.sql (clean + production-ready)

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES public.products(id) ON DELETE CASCADE,

    customer_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

    comment TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- One review per user per product
    UNIQUE (product_id, customer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_customer_id
ON public.reviews(customer_id);

-- --- RLS and Permissions Setup ---
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE public.reviews TO anon, authenticated, service_role;

-- Grant sequence privileges if any exist for this table
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read reviews
CREATE POLICY "Public can view reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);

-- Users can only manage their own reviews
CREATE POLICY "Users manage own reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Service role full access (backend / admin / stripe)
CREATE POLICY "Service role full access reviews"
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 10_product_rating_triggers.sql
-- Auto update product rating + review count

-- 1. Function: Recalculate rating for a product
CREATE OR REPLACE FUNCTION public.recalculate_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET
        avg_rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM public.reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ), 0),

        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),

        updated_at = NOW()

    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: INSERT review
DROP TRIGGER IF EXISTS trigger_reviews_insert ON public.reviews;

CREATE TRIGGER trigger_reviews_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_product_rating();

-- 3. Trigger: UPDATE review
DROP TRIGGER IF EXISTS trigger_reviews_update ON public.reviews;

CREATE TRIGGER trigger_reviews_update
AFTER UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_product_rating();

-- 4. Trigger: DELETE review
DROP TRIGGER IF EXISTS trigger_reviews_delete ON public.reviews;

CREATE TRIGGER trigger_reviews_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_product_rating();