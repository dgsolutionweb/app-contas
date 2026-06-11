import type { ParsedIntent } from '../types';
import { supabase } from './supabase';

const INTENT_TYPES = [
  'add', 'list', 'mark_paid', 'pay_all', 'delete', 'edit', 'edit_value',
  'summary', 'search', 'upcoming', 'overdue', 'compare_months',
  'top_expenses', 'category_analysis', 'forecast', 'insights', 'help', 'unknown',
] as const;


function normalizeIntent(raw: any): ParsedIntent | null {
  switch (raw?.type) {
    case 'add':
      return {
        type: 'add', descricao: raw.descricao || 'Conta', valor: Number(raw.valor) || 0,
        vencimento: raw.vencimento || '', categoria: raw.categoria || 'outros',
        parcelas: Math.max(1, Number(raw.parcelas) || 1), fixa: Boolean(raw.fixa),
        valor_total: Boolean(raw.valor_total),
      };
    case 'list': return { type: 'list', filtro: raw.filtro || 'todas' };
    case 'mark_paid': return { type: 'mark_paid', query: raw.query || '' };
    case 'pay_all': return { type: 'pay_all' };
    case 'delete': return { type: 'delete', query: raw.query || '' };
    case 'edit': return { type: 'edit', query: raw.query || '' };
    case 'edit_value': return { type: 'edit_value', valor: Number(raw.valor) || 0, vencimento: raw.vencimento || '' };
    case 'summary': return { type: 'summary', yearMonth: raw.yearMonth || '' };
    case 'search': return { type: 'search', query: raw.query || '' };
    case 'upcoming': return { type: 'upcoming' };
    case 'overdue': return { type: 'overdue' };
    case 'compare_months': return { type: 'compare_months', yearMonth: raw.yearMonth || '' };
    case 'top_expenses': return { type: 'top_expenses', yearMonth: raw.yearMonth || '', limit: Number(raw.limit) || 5 };
    case 'category_analysis': return { type: 'category_analysis', yearMonth: raw.yearMonth || '' };
    case 'forecast': return { type: 'forecast', months: Number(raw.months) || 3 };
    case 'insights': return { type: 'insights', yearMonth: raw.yearMonth || '' };
    case 'help': return { type: 'help' };
    case 'unknown': return { type: 'unknown' };
    default: return null;
  }
}

export async function parseWithOpenAI(text: string): Promise<ParsedIntent | null> {
  try {
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const { data, error } = await supabase.functions.invoke('parse-financial-intent', {
      body: { text, localDate },
    });

    if (error || !data?.intent) return null;
    return normalizeIntent(data.intent);
  } catch {
    return null;
  }
}
