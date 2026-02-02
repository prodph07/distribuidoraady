-- Fix RLS Policies for Combo Items
-- The previous policy only allowed 'service_role' (backend) to write.
-- We need to allow the frontend (anon/authenticated) to manage these items since the Admin Dashboard runs client-side.

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admin manage combo items" ON combo_items;

-- Create a new permissive policy for Admins (client-side)
CREATE POLICY "Enable all access for admin users" 
ON combo_items 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
