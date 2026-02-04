insert into home_sections (slug, name, active, order_index, config) values
('hero', 'Banner Principal (Hero - Coleção Destaque)', true, 1, '{}'),
('banners', 'Banners Destaques (Grid Duplo)', true, 2, '{}')
on conflict (slug) do nothing;
