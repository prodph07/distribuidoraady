-- Home Sections Configuration Table
create table if not exists home_sections (
  slug text primary key,
  name text not null,
  active boolean default true,
  config jsonb default '{}'::jsonb,
  order_index int default 0
);

-- Enable RLS
alter table home_sections enable row level security;
create policy "Enable read for public" on home_sections for select to public using (true);
create policy "Enable all for public" on home_sections for all to public using (true);

-- Seed Data (replicating current hardcoded state)
insert into home_sections (slug, name, active, order_index, config) values
('coupon', 'Banner de Cupom (1ª Compra)', true, 3, '{
  "title": "Cupom de frete grátis na 1ª compra!", 
  "subtitle": "Aproveite para pedir suas bebidas favoritas.",
  "icon": "🏷️"
}'),
('categories', 'Grid de Categorias', true, 4, '{}'),
('recommended', 'Recomendados (Destilados)', true, 8, '{
  "title": "Recomendados pelo Ady",
  "keywords": ["destilado", "vodka", "whisky", "gin"]
}'),
('beers', 'Cervejas (Grid)', true, 9, '{
  "title": "Cervejas Geladas",
  "keywords": ["cerveja", "brahma", "heineken"]
}'),
('carnaval', 'Banner Sazonal (Carnaval)', true, 10, '{
  "title": "Bora Garantir O Chopp", 
  "subtitle": "Do Carnaval",
  "button_text": "Aproveitar!",
  "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuB0b2FLtaELylN6aUD6iXdWZUxV_jKXj-uN2pY_S08ub4YcmsFwt2QyE74FmNW8wObYPS2Tr4Mjm2GhCZPDqP6yEJHTDKdTydkeM5XVmjQ9xjrlOQH2ZnqdVjWa1UsVkIBebZ6EnCP7dJ1wKT2Uc2DZzI5QJVxhA8yZdZz_IDblr2jwApM58rH4hqMGiPv2KcYdq2Vo2TIDVMwoP1S_p-WTC26mH4JvSldYGFaH1RWUlGQh8KOGPbnidUCpBE70uXvBQu_00poD7cOl",
  "link": "#"
}'),
('brands', 'Grid de Marcas', true, 11, '{}')
on conflict (slug) do nothing;
