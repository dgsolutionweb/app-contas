import { supabase } from '../services/supabase';
import type { Conta, SummaryPayload } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Utility to map Supabase boolean to app's 0 | 1
const mapConta = (row: any): Conta => ({
  ...row,
  vencimento: row.vencimento ? row.vencimento.toString().slice(0, 10) : '',
  pago: row.pago ? 1 : 0,
  recorrente: row.recorrente ? 1 : 0,
});

export async function addConta(
  _db: any,
  data: Omit<Conta, 'id' | 'pago' | 'criado_em'>
): Promise<number> {
  const { data: inserted, error } = await supabase
    .from('contas')
    .insert({
      descricao: data.descricao,
      valor: data.valor,
      vencimento: data.vencimento,
      categoria: data.categoria,
      recorrente: data.recorrente === 1,
      nota: data.nota || null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

export async function updateConta(
  _db: any,
  id: number,
  data: Partial<Omit<Conta, 'id' | 'criado_em'>>
): Promise<void> {
  const updates: any = {};
  if (data.descricao !== undefined) updates.descricao = data.descricao;
  if (data.valor !== undefined) updates.valor = data.valor;
  if (data.vencimento !== undefined) updates.vencimento = data.vencimento;
  if (data.categoria !== undefined) updates.categoria = data.categoria;
  if (data.pago !== undefined) updates.pago = data.pago === 1;
  if (data.recorrente !== undefined) updates.recorrente = data.recorrente === 1;
  if (data.nota !== undefined) updates.nota = data.nota || null;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from('contas').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getAllContas(
  _db: any,
  filtro: 'pendentes' | 'pagas' | 'todas' = 'todas'
): Promise<Conta[]> {
  let query = supabase.from('contas').select('*');

  if (filtro === 'pendentes') {
    query = query.eq('pago', false).order('vencimento', { ascending: true });
  } else if (filtro === 'pagas') {
    query = query.eq('pago', true).order('vencimento', { ascending: false });
  } else {
    query = query.order('vencimento', { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapConta);
}

export async function searchContas(
  _db: any,
  queryText: string
): Promise<Conta[]> {
  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('pago', false)
    .ilike('descricao', `%${queryText}%`)
    .order('vencimento', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapConta);
}

export async function markAsPaid(_db: any, id: number): Promise<void> {
  const { error } = await supabase.from('contas').update({ pago: true }).eq('id', id);
  if (error) throw error;
}

export async function deleteConta(_db: any, id: number): Promise<void> {
  const { error } = await supabase.from('contas').delete().eq('id', id);
  if (error) throw error;
}

export async function getUpcomingContas(_db: any, days = 7): Promise<Conta[]> {
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + days);
  
  const todayStr = today.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('pago', false)
    .gte('vencimento', todayStr)
    .lte('vencimento', futureStr)
    .order('vencimento', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapConta);
}

export async function getOverdueContas(_db: any): Promise<Conta[]> {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('pago', false)
    .lt('vencimento', todayStr)
    .order('vencimento', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapConta);
}

export async function payAllPending(_db: any): Promise<number> {
  const todayStr = new Date().toISOString().slice(0, 10);
  // Por precaução, pagar apenas as que vencem até hoje ou no mês atual
  // Vamos atualizar a lógica para pagar todas que vencem até o final do mês atual
  const [year, month] = todayStr.split('-');
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const limitDateStr = nextMonth.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('contas')
    .update({ pago: true })
    .eq('pago', false)
    .lt('vencimento', limitDateStr)
    .select('id');
    
  if (error) throw error;
  return data?.length || 0;
}

export async function payMonthBills(_db: any, yearMonth: string): Promise<number> {
  const startDate = `${yearMonth}-01`;
  const [year, month] = yearMonth.split('-');
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const nextMonthStr = nextMonth.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('contas')
    .update({ pago: true })
    .eq('pago', false)
    .gte('vencimento', startDate)
    .lt('vencimento', nextMonthStr)
    .select('id');
    
  if (error) throw error;
  return data?.length || 0;
}

export async function getMonthlySummary(
  _db: any,
  yearMonth: string
): Promise<SummaryPayload> {
  // yearMonth format: YYYY-MM
  const startDate = `${yearMonth}-01`;
  // calculate end date
  const [year, month] = yearMonth.split('-');
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  const nextMonthStr = nextMonth.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .gte('vencimento', startDate)
    .lt('vencimento', nextMonthStr);

  if (error) throw error;

  let total = 0;
  let totalPago = 0;
  let count = 0;
  let countPago = 0;
  const categoriesMap: Record<string, number> = {};

  (data || []).forEach(row => {
    const val = Number(row.valor);
    total += val;
    count += 1;
    if (row.pago) {
      totalPago += val;
      countPago += 1;
    }
    const rawCat = row.categoria || 'outros';
    const cat = rawCat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    categoriesMap[cat] = (categoriesMap[cat] || 0) + val;
  });

  const porCategoria = Object.entries(categoriesMap)
    .map(([categoria, t]) => ({ categoria, total: t }))
    .sort((a, b) => b.total - a.total);

  const dateForLabel = new Date(parseInt(year), parseInt(month) - 1, 1);
  const mes = format(dateForLabel, 'MMMM yyyy', { locale: ptBR });
  const mesCapitalized = mes.charAt(0).toUpperCase() + mes.slice(1);

  return {
    mes: mesCapitalized,
    yearMonth,
    total,
    totalPago,
    totalPendente: total - totalPago,
    count,
    countPago,
    porCategoria,
  };
}
