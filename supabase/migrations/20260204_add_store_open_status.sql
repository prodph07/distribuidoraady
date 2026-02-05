-- Add is_open column to store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT TRUE;

-- Update RLS policies to ensure public can read this new column (already covered by "Public can view store settings" SELECT policy, but good to verify)
