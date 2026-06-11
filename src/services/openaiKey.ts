import { supabase } from './supabase';

export interface OpenAIKeyStatus {
  configured: boolean;
  keyHint: string | null;
  updatedAt: string | null;
}

const emptyStatus: OpenAIKeyStatus = {
  configured: false,
  keyHint: null,
  updatedAt: null,
};

export async function getOpenAIKeyStatus(): Promise<OpenAIKeyStatus> {
  const { data, error } = await supabase.functions.invoke('manage-openai-key', {
    method: 'GET',
  });
  if (error) throw error;
  return { ...emptyStatus, ...data };
}

export async function saveOpenAIKey(apiKey: string): Promise<OpenAIKeyStatus> {
  const { data, error } = await supabase.functions.invoke('manage-openai-key', {
    method: 'POST',
    body: { apiKey },
  });
  if (error) throw error;
  return { ...emptyStatus, ...data };
}

export async function deleteOpenAIKey(): Promise<void> {
  const { error } = await supabase.functions.invoke('manage-openai-key', {
    method: 'DELETE',
  });
  if (error) throw error;
}
