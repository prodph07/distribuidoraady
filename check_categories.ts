
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    const distinctCategories = [...new Set(data.map((p: any) => p.category))];
    console.log('Distinct Categories:', distinctCategories);

    // Also check some product names to see formatting
    const { data: products } = await supabase.from('products').select('name, category').limit(20);
    console.log('Sample Products:', products);
}

checkCategories();
