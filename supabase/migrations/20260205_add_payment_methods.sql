-- Add payment details to orders table
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'pix', -- 'pix', 'money', 'card_machine'
ADD COLUMN IF NOT EXISTS "change_needed" numeric DEFAULT 0;

-- Optional: Add comment
COMMENT ON COLUMN "public"."orders"."payment_method" IS 'Method of payment: pix, money, card_machine';
COMMENT ON COLUMN "public"."orders"."change_needed" IS 'Change needed for cash payments (e.g. 50.00)';
