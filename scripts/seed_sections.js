
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env.local, checking process.env");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const sections = [
        { slug: 'hero', name: 'Banner Principal (Hero - Coleção Destaque)', active: true, order_index: 0, config: {} },
        { slug: 'banners', name: 'Banners Destaques (Grid Duplo)', active: true, order_index: 1, config: {} }
    ];

    for (const s of sections) {
        const { error } = await supabase.from('home_sections').upsert(s, { onConflict: 'slug' });
        if (error) console.error("Error upserting", s.slug, error);
        else console.log("Upserted", s.slug);
    }
}

seed();
