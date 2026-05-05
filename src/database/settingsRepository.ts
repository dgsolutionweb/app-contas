import { supabase } from '../services/supabase';

export async function getSetting(_db: any, key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means zero rows returned from single()
    console.error('Error fetching setting:', error);
    return null;
  }
  return data?.value ?? null;
}

export async function setSetting(_db: any, key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value });

  if (error) throw error;
}

export async function getAllSettings(_db: any): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error) throw error;

  const result: Record<string, string> = {};
  for (const row of data || []) {
    result[row.key] = row.value;
  }
  return result;
}
