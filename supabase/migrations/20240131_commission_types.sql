
-- Add commission configuration columns
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'tiers'; -- 'tiers' or 'fixed'
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS commission_fixed_value DECIMAL(10,2) DEFAULT 0.00;
