-- Drop existing anon policies which might be insufficient if user is authenticated
drop policy if exists "Enable update for all users" on banners;
drop policy if exists "Enable delete for all users" on banners;
drop policy if exists "Enable insert for all users" on banners;

-- Create policies for public (covers both anon and authenticated roles)
create policy "Enable insert for public" on banners for insert to public with check (true);
create policy "Enable update for public" on banners for update to public using (true);
create policy "Enable delete for public" on banners for delete to public using (true);
create policy "Enable select for public" on banners for select to public using (true);

-- Repeat for collections
drop policy if exists "Enable update for all users" on collections;
drop policy if exists "Enable delete for all users" on collections;
drop policy if exists "Enable insert for all users" on collections;

create policy "Enable insert for public" on collections for insert to public with check (true);
create policy "Enable update for public" on collections for update to public using (true);
create policy "Enable delete for public" on collections for delete to public using (true);
create policy "Enable select for public" on collections for select to public using (true);

-- Repeat for collection_items
drop policy if exists "Enable update for all users" on collection_items;
drop policy if exists "Enable delete for all users" on collection_items;
drop policy if exists "Enable insert for all users" on collection_items;

create policy "Enable insert for public" on collection_items for insert to public with check (true);
create policy "Enable update for public" on collection_items for update to public using (true);
create policy "Enable delete for public" on collection_items for delete to public using (true);
create policy "Enable select for public" on collection_items for select to public using (true);
