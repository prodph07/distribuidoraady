-- Banners Table
create table if not exists banners (
  id bigint primary key generated always as identity,
  title text,
  image_url text not null,
  link_url text, -- Internal path (e.g. /colecao/verao) or external
  position text default 'main', -- 'main', 'secondary'
  order_index int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Policies for Banners
alter table banners enable row level security;
create policy "Enable read access for all users" on banners for select to anon using (true);
create policy "Enable insert for all users" on banners for insert to anon with check (true);
create policy "Enable update for all users" on banners for update to anon using (true);
create policy "Enable delete for all users" on banners for delete to anon using (true);

-- Collections Table (Promotions, Brands, etc)
create table if not exists collections (
  id bigint primary key generated always as identity,
  title text not null,
  slug text not null unique, -- url friendly id (e.g. verao-2024)
  description text,
  image_url text, -- Banner for the collection page
  active boolean default true,
  featured boolean default false, -- Show on Home Page?
  created_at timestamptz default now()
);

-- Policies for Collections
alter table collections enable row level security;
create policy "Enable read access for all users" on collections for select to anon using (true);
create policy "Enable insert for all users" on collections for insert to anon with check (true);
create policy "Enable update for all users" on collections for update to anon using (true);
create policy "Enable delete for all users" on collections for delete to anon using (true);

-- Collection Items (Many-to-Many products)
create table if not exists collection_items (
  id bigint primary key generated always as identity,
  collection_id bigint references collections(id) on delete cascade,
  product_id bigint references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(collection_id, product_id)
);

-- Policies for Collection Items
alter table collection_items enable row level security;
create policy "Enable read access for all users" on collection_items for select to anon using (true);
create policy "Enable insert for all users" on collection_items for insert to anon with check (true);
create policy "Enable update for all users" on collection_items for update to anon using (true);
create policy "Enable delete for all users" on collection_items for delete to anon using (true);
