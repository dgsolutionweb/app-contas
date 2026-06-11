import { addMonths, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conta, SummaryPayload } from '../types';
import { CATEGORIES } from '../theme/tokens';
import { formatCurrency } from './formatter';

function monthLabel(yearMonth: string): string {
  const date = parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date());
  const label = format(date, 'MMMM yyyy', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function previousYearMonth(yearMonth: string): string {
  return format(addMonths(parse(`${yearMonth}-01`, 'yyyy-MM-dd', new Date()), -1), 'yyyy-MM');
}

export function formatMonthComparison(current: SummaryPayload, previous: SummaryPayload): string {
  if (!current.count && !previous.count) return 'Não há contas suficientes nos dois meses para comparar.';
  const difference = current.total - previous.total;
  const percent = previous.total > 0 ? Math.abs((difference / previous.total) * 100) : 0;
  const direction = difference > 0 ? 'aumentaram' : difference < 0 ? 'diminuíram' : 'ficaram estáveis';
  const detail = difference === 0
    ? 'O total foi o mesmo nos dois meses.'
    : `Seus gastos ${direction} ${formatCurrency(Math.abs(difference))}${previous.total > 0 ? ` (${percent.toFixed(1).replace('.', ',')}%)` : ''}.`;
  return `*Comparação mensal*\n${previous.mes}: ${formatCurrency(previous.total)}\n${current.mes}: ${formatCurrency(current.total)}\n\n${detail}`;
}

export function formatTopExpenses(bills: Conta[], yearMonth: string, limit: number): string {
  const selected = bills
    .filter((bill) => bill.vencimento.startsWith(yearMonth))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, Math.max(1, Math.min(limit, 20)));
  if (!selected.length) return `Não encontrei despesas em ${monthLabel(yearMonth)}.`;
  const lines = selected.map((bill, index) => `${index + 1}. *${bill.descricao}*: ${formatCurrency(bill.valor)}`);
  return `*Maiores despesas de ${monthLabel(yearMonth)}*\n${lines.join('\n')}`;
}

export function formatCategoryAnalysis(summary: SummaryPayload): string {
  if (!summary.count) return `Não há contas para analisar em ${summary.mes}.`;
  const lines = summary.porCategoria.slice(0, 6).map((item) => {
    const label = CATEGORIES[item.categoria]?.label || item.categoria;
    const percent = summary.total > 0 ? (item.total / summary.total) * 100 : 0;
    return `• *${label}*: ${formatCurrency(item.total)} (${percent.toFixed(1).replace('.', ',')}%)`;
  });
  return `*Gastos por categoria em ${summary.mes}*\n${lines.join('\n')}`;
}

export function formatForecast(bills: Conta[], months: number): string {
  const start = new Date();
  const lines: string[] = [];
  for (let offset = 0; offset < Math.max(1, Math.min(months, 12)); offset++) {
    const date = addMonths(start, offset);
    const key = format(date, 'yyyy-MM');
    const monthBills = bills.filter((bill) => bill.vencimento.startsWith(key) && !bill.pago);
    const total = monthBills.reduce((sum, bill) => sum + bill.valor, 0);
    lines.push(`• *${monthLabel(key)}*: ${formatCurrency(total)} em ${monthBills.length} conta(s)`);
  }
  return `*Projeção de compromissos*\n${lines.join('\n')}\n\nValores baseados nas contas já cadastradas.`;
}

export function formatFinancialInsights(bills: Conta[], summary: SummaryPayload): string {
  if (!summary.count) return `Ainda não há dados suficientes em ${summary.mes} para gerar insights.`;
  const pending = bills.filter((bill) => !bill.pago && bill.vencimento.startsWith(summary.yearMonth));
  const recurring = bills.filter((bill) => bill.recorrente && bill.vencimento.startsWith(summary.yearMonth));
  const recurringTotal = recurring.reduce((sum, bill) => sum + bill.valor, 0);
  const topCategory = summary.porCategoria[0];
  const topLabel = topCategory ? CATEGORIES[topCategory.categoria]?.label || topCategory.categoria : 'Sem categoria';
  const topPercent = topCategory && summary.total ? (topCategory.total / summary.total) * 100 : 0;
  const largest = bills.filter((bill) => bill.vencimento.startsWith(summary.yearMonth)).sort((a, b) => b.valor - a.valor)[0];

  return `*Diagnóstico de ${summary.mes}*\n` +
    `• Total previsto: ${formatCurrency(summary.total)}\n` +
    `• Ainda pendente: ${formatCurrency(summary.totalPendente)} em ${pending.length} conta(s)\n` +
    `• Maior categoria: ${topLabel} (${topPercent.toFixed(1).replace('.', ',')}%)\n` +
    `• Compromissos recorrentes: ${formatCurrency(recurringTotal)}\n` +
    (largest ? `• Maior despesa individual: ${largest.descricao}, ${formatCurrency(largest.valor)}\n` : '') +
    `\n*Oportunidade:* revise primeiro ${topLabel.toLowerCase()} e despesas recorrentes, pois concentram a parte mais previsível do orçamento.`;
}
