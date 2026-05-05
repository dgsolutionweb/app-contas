import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data, error } = await supabase.from('contas').select('*');
  console.log('Total bills:', data?.length);
}
run();
