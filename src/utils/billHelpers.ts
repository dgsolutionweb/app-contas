import type { Conta } from '../types';

export function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatBRLFull(n: number): string {
  return 'R$ ' + formatBRL(n);
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(dateStr: string, today = new Date()): number {
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d = parseISODate(dateStr);
  return Math.round((d.getTime() - todayMidnight.getTime()) / 86400000);
}

export function formatDueShort(dateStr: string, today = new Date()): string {
  const diff = daysUntil(dateStr, today);
  if (diff === 0) return 'Vence hoje';
  if (diff === 1) return 'Vence amanhã';
  if (diff === -1) return 'Venceu ontem';
  if (diff < 0) return `Venceu há ${-diff} dias`;
  if (diff < 7) return `Em ${diff} dias`;
  const d = parseISODate(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatDateLong(dateStr: string): string {
  const d = parseISODate(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export interface BillSummary {
  pending: Conta[];
  paid: Conta[];
  totalMonth: number;
  totalPending: number;
  totalPaid: number;
  upcoming: Conta[];
  byCat: Record<string, { total: number; count: number; paid: number }>;
  countTotal: number;
  countPaid: number;
}

export function computeSummary(bills: Conta[]): BillSummary {
  const pending = bills.filter(b => !b.pago);
  const paid = bills.filter(b => b.pago);
  const totalMonth = bills.reduce((s, b) => s + b.valor, 0);
  const totalPending = pending.reduce((s, b) => s + b.valor, 0);
  const totalPaid = paid.reduce((s, b) => s + b.valor, 0);
  const upcoming = [...pending].sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const byCat: Record<string, { total: number; count: number; paid: number }> = {};
  for (const b of bills) {
    if (!byCat[b.categoria]) byCat[b.categoria] = { total: 0, count: 0, paid: 0 };
    byCat[b.categoria].total += b.valor;
    byCat[b.categoria].count += 1;
    if (b.pago) byCat[b.categoria].paid += b.valor;
  }

  return {
    pending, paid, totalMonth, totalPending, totalPaid, upcoming, byCat,
    countTotal: bills.length, countPaid: paid.length,
  };
}

export function groupLabel(dueStr: string): string {
  const d = daysUntil(dueStr);
  if (d < 0) return 'Atrasadas';
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Amanhã';
  if (d < 7) return 'Esta semana';
  if (d < 15) return 'Próximas 2 semanas';
  return 'Este mês';
}
