import { supabase } from '../services/supabase';
import type { ChatMessage } from '../types';

export async function saveMessage(
  _db: any,
  message: Omit<ChatMessage, 'id'>
): Promise<number> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      role: message.role,
      content: message.content,
      tipo: message.tipo,
      payload: message.payload || null,
      criado_em: message.criado_em,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getAllMessages(_db: any): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('criado_em', { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    tipo: row.tipo as ChatMessage['tipo'],
    payload: row.payload ? row.payload : undefined,
    criado_em: row.criado_em,
  }));
}

export async function countMessages(_db: any): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export async function clearHistory(_db: any): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .neq('id', 0); // Delete all rows (neq to some dummy value since no empty delete allowed in PostgREST without a filter)
  if (error) throw error;
}
