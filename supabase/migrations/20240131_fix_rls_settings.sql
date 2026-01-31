-- Allow update access to anon users (for dev/mvp where auth might be bypassed)
DROP POLICY IF EXISTS "Admins can update store settings" ON store_settings;

CREATE POLICY "Everyone can update store settings" ON store_settings
    FOR UPDATE USING (true);
