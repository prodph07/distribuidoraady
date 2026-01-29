-- Products Table
create table if not exists products (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  image_url text,
  price numeric not null, -- Liquid only price
  deposit_price numeric not null default 0, -- Bottle/Crate deposit price
  is_returnable boolean default false,
  in_stock boolean default true,
  stock_quantity int default 0,
  category text, 
  subcategory text,
  cost_price numeric default 0,
  bottle_cost numeric default 0,
  created_at timestamptz default now()
);

-- Orders Table
create table if not exists orders (
  id bigint primary key generated always as identity,
  customer_name text not null,
  customer_phone text not null,
  address text not null,
  status text not null default 'pending_payment', -- pending_payment, preparing, out_for_delivery, delivered, cancelled
  payment_id text,
  total_amount numeric not null,
  created_at timestamptz default now()
);

-- Order Items Table
create table if not exists order_items (
  id bigint primary key generated always as identity,
  order_id bigint references orders(id) on delete cascade,
  product_id bigint references products(id),
  quantity int not null default 1,
  is_exchange boolean default false, -- true = user has bottle, false = user bought bottle
  price_snapshot numeric not null, -- Price paid per unit at time of order
  created_at timestamptz default now()
);

-- Enable Realtime (Ignorar se já estiver ativo)
-- alter publication supabase_realtime add table orders;

-- RLS POLICIES (IMPORTANT)
-- Enable RLS
alter table orders enable row level security;
alter table order_items enable row level security;
alter table products enable row level security;

-- Policies for Orders
drop policy if exists "Enable insert for anon orders" on orders;
create policy "Enable insert for anon orders" 
on orders for insert 
to anon 
with check (true);

drop policy if exists "Enable select for anon orders" on orders;
create policy "Enable select for anon orders" 
on orders for select 
to anon 
using (true);

drop policy if exists "Enable update for anon orders" on orders;
create policy "Enable update for anon orders" 
on orders for update
to anon 
using (true);


-- Policies for Order Items
drop policy if exists "Enable insert for anon items" on order_items;
create policy "Enable insert for anon items" 
on order_items for insert 
to anon 
with check (true);

drop policy if exists "Enable select for anon items" on order_items;
create policy "Enable select for anon items" 
on order_items for select 
to anon 
using (true);

-- Policies for Products
drop policy if exists "Enable read access for all users" on products;
create policy "Enable read access for all users" 
on products for select 
to anon 
using (true);

drop policy if exists "Enable insert for all users" on products;
create policy "Enable insert for all users" 
on products for insert 
to anon 
with check (true);

drop policy if exists "Enable update for all users" on products;
create policy "Enable update for all users" 
on products for update 
to anon 
using (true);

drop policy if exists "Enable delete for all users" on products;
create policy "Enable delete for all users" 
on products for delete
to anon 
using (true);

-- Categories & Subcategories
create table if not exists categories (
  id bigint primary key generated always as identity,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists subcategories (
  id bigint primary key generated always as identity,
  name text not null,
  category_id bigint references categories(id) on delete cascade,
  created_at timestamptz default now()
);

-- Policies for Categories
create policy "Enable read access for all users" on categories for select to anon using (true);
create policy "Enable insert for all users" on categories for insert to anon with check (true);
create policy "Enable update for all users" on categories for update to anon using (true);
create policy "Enable delete for all users" on categories for delete to anon using (true);

-- Policies for Subcategories
create policy "Enable read access for all users" on subcategories for select to anon using (true);
create policy "Enable insert for all users" on subcategories for insert to anon with check (true);
create policy "Enable update for all users" on subcategories for update to anon using (true);
create policy "Enable delete for all users" on subcategories for delete to anon using (true);
