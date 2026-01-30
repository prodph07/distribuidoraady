
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking banners table...');
    const { data, error } = await supabase.from('banners').select('*').limit(1);
    if (error) {
        console.error('Error selecting from banners:', error.message);
    } else {
        console.log('Banners table exists. Data:', data);
    }
}

check();
