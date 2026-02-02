-- Add archived column to orders table
ALTER TABLE "public"."orders" ADD COLUMN "archived" boolean DEFAULT false;

-- Add index for performance on filtering non-archived orders
CREATE INDEX IF NOT EXISTS "orders_archived_idx" ON "public"."orders" ("archived");
