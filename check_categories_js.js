
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking categories...');
    const { data: products, error } = await supabase.from('products').select('category, name');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const categories = new Set(products.map(p => p.category).filter(c => c));
    console.log('Categories found:', [...categories]);

    // Check brands (sample)
    console.log('Sample names:', products.slice(0, 5).map(p => p.name));
}

check();
