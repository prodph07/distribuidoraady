UPDATE home_sections
SET config = '{
  "title": "Vai de quê hoje?"
}'::jsonb
WHERE slug = 'categories';

UPDATE home_sections
SET config = '{
  "title": "Marcas que amamos"
}'::jsonb
WHERE slug = 'brands';

UPDATE home_sections
SET config = '{
  "title": "Cupom de frete grátis na 1ª compra!", 
  "subtitle": "Aproveite para pedir suas bebidas favoritas.",
  "icon": "🏷️"
}'::jsonb
WHERE slug = 'coupon';

UPDATE home_sections
SET config = '{
  "title": "Recomendados pelo Ady",
  "keywords": ["destilado", "vodka", "whisky", "gin"]
}'::jsonb
WHERE slug = 'recommended';

UPDATE home_sections
SET config = '{
  "title": "Cervejas Geladas",
  "keywords": ["cerveja", "brahma", "heineken"]
}'::jsonb
WHERE slug = 'beers';
