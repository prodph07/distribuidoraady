-- Run this in your Supabase SQL Editor

-- 1. Create Couriers Table
create table if not exists couriers (
  id bigint primary key generated always as identity,
  name text not null,
  phone text not null,
  vehicle_type text default 'motorcycle', -- motorcycle, bike, car
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Policies for Couriers
alter table couriers enable row level security;
create policy "Enable read access for all users" on couriers for select to anon using (true);
create policy "Enable insert for all users" on couriers for insert to anon with check (true);
create policy "Enable update for all users" on couriers for update to anon using (true);
create policy "Enable delete for all users" on couriers for delete to anon using (true);


-- 3. Update Orders Table with new columns
-- Check if columns exist before adding (Supabase SQL Editor should handle 'if not exists' via manual checks typically, but here are the commands)

alter table orders add column if not exists courier_id bigint references couriers(id);
alter table orders add column if not exists delivery_cost numeric default 0;

-- Optional: Create a view for Profit if computed columns are tricky in existing table
create or replace view order_profits as
select 
  id as order_id,
  total_amount,
  delivery_cost,
  (total_amount - delivery_cost) as profit
from orders;
