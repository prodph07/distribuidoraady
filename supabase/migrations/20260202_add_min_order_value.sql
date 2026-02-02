-- Add min_order_value column to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS min_order_value NUMERIC DEFAULT 0;

-- Update RLS if needed (usually existing policies cover updates if they exist)
-- Ensure the column is accessible
GRANT SELECT, UPDATE ON settings TO authenticated;
GRANT SELECT ON settings TO anon;
