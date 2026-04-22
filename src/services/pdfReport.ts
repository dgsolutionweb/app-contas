import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getAllContas, getMonthlySummary, getOverdueContas, getUpcomingContas } from '../database/contasRepository';
import type { Conta } from '../types';
import type { ThemeTokens } from '../theme/tokens';
import { CATEGORIES } from '../theme/tokens';
import { currentYearMonth, formatDisplayDate } from '../utils/dateHelpers';
import { computeSummary, daysUntil, formatBRLFull } from '../utils/billHelpers';

type ExportResult =
  | { type: 'shared'; uri: string }
  | { type: 'saved'; uri: string }
  | { type: 'print_dialog' };

interface ExportParams {
  db: SQLiteDatabase;
  T: ThemeTokens;
  userName?: string;
  defaultDueDay: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value: number): string {
  return formatBRLFull(value);
}

function formatGeneratedAt(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getStatusLabel(conta: Conta): string {
  if (conta.pago) return 'Paga';
  const diff = daysUntil(conta.vencimento);
  if (diff < 0) return 'Atrasada';
  if (diff === 0) return 'Vence hoje';
  if (diff <= 7) return 'Em breve';
  return 'Pendente';
}

function getStatusTone(conta: Conta, T: ThemeTokens): { fg: string; bg: string; border: string } {
  if (conta.pago) {
    return { fg: T.success, bg: 'rgba(77,232,143,0.12)', border: 'rgba(77,232,143,0.2)' };
  }
  const diff = daysUntil(conta.vencimento);
  if (diff < 0) {
    return { fg: T.danger, bg: 'rgba(255,94,94,0.12)', border: 'rgba(255,94,94,0.2)' };
  }
  if (diff <= 7) {
    return { fg: T.warn, bg: 'rgba(255,184,77,0.12)', border: 'rgba(255,184,77,0.2)' };
  }
  return { fg: T.textDim, bg: T.chipBg, border: T.borderStrong };
}

function buildTableRows(bills: Conta[], T: ThemeTokens): string {
  if (bills.length === 0) {
    return `
      <tr>
        <td colspan="6" class="empty-cell">Nenhuma conta nesta seção.</td>
      </tr>
    `;
  }

  return bills
    .map((bill) => {
      const category = CATEGORIES[bill.categoria] ?? CATEGORIES.outros;
      const tone = getStatusTone(bill, T);
      return `
        <tr>
          <td>
            <div class="bill-title">${escapeHtml(bill.descricao)}</div>
            <div class="bill-sub">${bill.recorrente ? 'Recorrente' : 'Lançamento avulso'}</div>
          </td>
          <td>
            <span class="category-pill" style="color:${category.color}; background:${category.bg};">
              ${escapeHtml(category.label)}
            </span>
          </td>
          <td>${escapeHtml(formatDisplayDate(bill.vencimento))}</td>
          <td class="money">${escapeHtml(formatCurrency(bill.valor))}</td>
          <td>
            <span class="status-pill" style="color:${tone.fg}; background:${tone.bg}; border-color:${tone.border};">
              ${escapeHtml(getStatusLabel(bill))}
            </span>
          </td>
          <td>${escapeHtml(new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(bill.criado_em)))}</td>
        </tr>
      `;
    })
    .join('');
}

function buildHighlightList(bills: Conta[], emptyText: string): string {
  if (bills.length === 0) {
    return `<div class="mini-empty">${escapeHtml(emptyText)}</div>`;
  }

  return bills
    .slice(0, 8)
    .map((bill) => `
      <div class="mini-row">
        <div>
          <div class="mini-title">${escapeHtml(bill.descricao)}</div>
          <div class="mini-sub">${escapeHtml(formatDisplayDate(bill.vencimento))}</div>
        </div>
        <div class="mini-money">${escapeHtml(formatCurrency(bill.valor))}</div>
      </div>
    `)
    .join('');
}

function buildCategoryRows(entries: Array<{ categoria: string; total: number }>, monthTotal: number): string {
  if (entries.length === 0) {
    return '<div class="mini-empty">Nenhuma categoria registrada neste mês.</div>';
  }

  return entries
    .map((entry) => {
      const category = CATEGORIES[entry.categoria] ?? CATEGORIES.outros;
      const pct = monthTotal > 0 ? Math.max(6, Math.round((entry.total / monthTotal) * 100)) : 0;
      return `
        <div class="category-row">
          <div class="category-meta">
            <span class="category-dot" style="background:${category.color};"></span>
            <span>${escapeHtml(category.label)}</span>
          </div>
          <div class="category-bar">
            <div class="category-fill" style="width:${pct}%; background:${category.color};"></div>
          </div>
          <div class="category-value">${escapeHtml(formatCurrency(entry.total))}</div>
        </div>
      `;
    })
    .join('');
}

function buildReportHtml(params: {
  T: ThemeTokens;
  userName: string;
  defaultDueDay: number;
  yearMonth: string;
  monthlySummary: Awaited<ReturnType<typeof getMonthlySummary>>;
  allBills: Conta[];
  overdue: Conta[];
  upcoming: Conta[];
}): string {
  const {
    T,
    userName,
    defaultDueDay,
    yearMonth,
    monthlySummary,
    allBills,
    overdue,
    upcoming,
  } = params;

  const overall = computeSummary(allBills);
  const pendingBills = overall.pending.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const paidBills = overall.paid.sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const recurringCount = allBills.filter((bill) => bill.recorrente).length;
  const generatedAt = formatGeneratedAt();
  const monthLabel = formatMonthLabel(yearMonth);
  const topCategory = monthlySummary.porCategoria[0];
  const completionPct = monthlySummary.total > 0 ? Math.round((monthlySummary.totalPago / monthlySummary.total) * 100) : 0;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resumo financeiro - ${escapeHtml(monthLabel)}</title>
    <style>
      @page { size: A4; margin: 16mm 14mm 18mm; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: ${T.bg};
        color: ${T.text};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { padding: 0; }
      .page {
        position: relative;
        min-height: 100%;
        background:
          radial-gradient(circle at top right, ${T.accent}22, transparent 30%),
          linear-gradient(180deg, ${T.bgElevated} 0%, ${T.bg} 100%);
      }
      .hero {
        overflow: hidden;
        position: relative;
        border-radius: 28px;
        padding: 26px 28px 24px;
        background:
          radial-gradient(circle at top right, ${T.accent} 0%, ${T.accent} 18%, transparent 18.2%),
          linear-gradient(180deg, ${T.surfaceHi} 0%, ${T.surface} 100%);
        border: 1px solid ${T.borderStrong};
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: auto -60px -80px auto;
        width: 220px;
        height: 220px;
        border-radius: 999px;
        background: ${T.accent}14;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: ${T.chipBg};
        color: ${T.textDim};
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .hero h1 {
        margin: 18px 0 6px;
        font-size: 34px;
        line-height: 1.04;
        letter-spacing: -0.06em;
      }
      .hero p {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: ${T.textDim};
        max-width: 72%;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 14px;
        margin-top: 22px;
      }
      .hero-card, .card {
        border-radius: 22px;
        background: ${T.surface};
        border: 1px solid ${T.border};
      }
      .hero-card {
        padding: 18px 18px 16px;
      }
      .hero-stat-label, .section-label {
        color: ${T.textFaint};
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        font-weight: 700;
      }
      .hero-total {
        margin-top: 10px;
        font-size: 31px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: -0.06em;
      }
      .hero-note {
        margin-top: 8px;
        color: ${T.textDim};
        font-size: 12px;
      }
      .progress-track {
        margin-top: 18px;
        height: 8px;
        border-radius: 999px;
        background: ${T.borderStrong};
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        width: ${completionPct}%;
        background: ${T.accent};
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin: 18px 0 0;
      }
      .stat-card {
        padding: 16px;
        border-radius: 20px;
        background: ${T.surface};
        border: 1px solid ${T.border};
      }
      .stat-value {
        margin-top: 10px;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }
      .stat-sub {
        margin-top: 6px;
        color: ${T.textDim};
        font-size: 12px;
        line-height: 1.5;
      }
      .section {
        margin-top: 18px;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 10px;
        padding: 0 4px;
      }
      .section-title {
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }
      .section-sub {
        color: ${T.textFaint};
        font-size: 12px;
      }
      .section-grid {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 12px;
      }
      .card {
        padding: 18px;
      }
      .category-row {
        display: grid;
        grid-template-columns: 156px 1fr 104px;
        gap: 12px;
        align-items: center;
        margin-top: 12px;
      }
      .category-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 600;
      }
      .category-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
      }
      .category-bar {
        height: 8px;
        background: ${T.chipBg};
        border-radius: 999px;
        overflow: hidden;
      }
      .category-fill {
        height: 100%;
        border-radius: 999px;
      }
      .category-value {
        text-align: right;
        font-size: 13px;
        font-weight: 700;
      }
      .mini-stack {
        display: grid;
        gap: 10px;
      }
      .mini-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid ${T.border};
      }
      .mini-row:last-child { border-bottom: 0; padding-bottom: 0; }
      .mini-title {
        font-size: 13px;
        font-weight: 700;
      }
      .mini-sub {
        margin-top: 4px;
        font-size: 12px;
        color: ${T.textDim};
      }
      .mini-money {
        white-space: nowrap;
        font-size: 13px;
        font-weight: 700;
      }
      .mini-empty, .empty-cell {
        color: ${T.textDim};
        font-size: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      thead th {
        padding: 12px 12px;
        text-align: left;
        color: ${T.textFaint};
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        border-bottom: 1px solid ${T.borderStrong};
      }
      tbody td {
        padding: 14px 12px;
        border-bottom: 1px solid ${T.border};
        font-size: 12px;
        vertical-align: top;
      }
      tbody tr:last-child td { border-bottom: 0; }
      .bill-title {
        font-size: 13px;
        font-weight: 700;
        line-height: 1.4;
      }
      .bill-sub {
        margin-top: 5px;
        color: ${T.textDim};
        font-size: 11px;
      }
      .money {
        white-space: nowrap;
        font-weight: 700;
      }
      .category-pill, .status-pill {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
      }
      .status-pill {
        border: 1px solid transparent;
      }
      .table-card {
        padding: 10px 0 0;
        overflow: hidden;
      }
      .table-card .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 0 18px 14px;
      }
      .table-title {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .table-meta {
        color: ${T.textDim};
        font-size: 12px;
      }
      .footer {
        margin-top: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: ${T.textFaint};
        font-size: 11px;
      }
      .page-break {
        break-before: page;
        page-break-before: always;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div class="eyebrow">Contas · Resumo em PDF</div>
        <h1>Relatório financeiro completo</h1>
        <p>
          Panorama consolidado de ${escapeHtml(userName)} com visão de ${escapeHtml(monthLabel)},
          status das contas, categorias, vencimentos críticos e histórico integral para compartilhar ou arquivar.
        </p>

        <div class="hero-grid">
          <div class="hero-card">
            <div class="hero-stat-label">Total pendente do mês</div>
            <div class="hero-total">${escapeHtml(formatCurrency(monthlySummary.totalPendente))}</div>
            <div class="hero-note">
              ${monthlySummary.count - monthlySummary.countPago} contas em aberto ·
              ${completionPct}% do mês já quitado
            </div>
            <div class="progress-track"><div class="progress-fill"></div></div>
          </div>
          <div class="hero-card">
            <div class="hero-stat-label">Gerado em</div>
            <div class="hero-total" style="font-size:18px; line-height:1.3; margin-top:12px;">${escapeHtml(generatedAt)}</div>
            <div class="hero-note">
              Dia padrão de vencimento: ${defaultDueDay}<br />
              Referência: ${escapeHtml(monthLabel)}
            </div>
          </div>
        </div>
      </section>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="section-label">Total do mês</div>
          <div class="stat-value">${escapeHtml(formatCurrency(monthlySummary.total))}</div>
          <div class="stat-sub">${monthlySummary.count} contas previstas em ${escapeHtml(monthlySummary.mes)}</div>
        </div>
        <div class="stat-card">
          <div class="section-label">Já pago</div>
          <div class="stat-value">${escapeHtml(formatCurrency(monthlySummary.totalPago))}</div>
          <div class="stat-sub">${monthlySummary.countPago} conta(s) quitadas no período</div>
        </div>
        <div class="stat-card">
          <div class="section-label">Em atraso</div>
          <div class="stat-value">${escapeHtml(formatCurrency(overdue.reduce((sum, bill) => sum + bill.valor, 0)))}</div>
          <div class="stat-sub">${overdue.length} conta(s) vencidas sem pagamento</div>
        </div>
        <div class="stat-card">
          <div class="section-label">Recorrentes</div>
          <div class="stat-value">${recurringCount}</div>
          <div class="stat-sub">
            ${topCategory ? `Maior categoria do mês: ${(CATEGORIES[topCategory.categoria] ?? CATEGORIES.outros).label}` : 'Sem categoria dominante'}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Visão executiva</div>
            <div class="section-sub">Resumo do comportamento financeiro deste mês</div>
          </div>
          <div class="section-sub">${escapeHtml(monthlySummary.mes)}</div>
        </div>
        <div class="section-grid">
          <div class="card">
            <div class="section-label">Distribuição por categoria</div>
            ${buildCategoryRows(monthlySummary.porCategoria, monthlySummary.total)}
          </div>
          <div class="card">
            <div class="section-label">Alertas e próximos passos</div>
            <div class="mini-stack" style="margin-top:10px;">
              <div class="mini-row">
                <div>
                  <div class="mini-title">Próximos 7 dias</div>
                  <div class="mini-sub">${upcoming.length} conta(s) programadas</div>
                </div>
                <div class="mini-money">${escapeHtml(formatCurrency(upcoming.reduce((sum, bill) => sum + bill.valor, 0)))}</div>
              </div>
              <div class="mini-row">
                <div>
                  <div class="mini-title">Base cadastrada</div>
                  <div class="mini-sub">${allBills.length} conta(s) no histórico</div>
                </div>
                <div class="mini-money">${escapeHtml(formatCurrency(overall.totalMonth))}</div>
              </div>
              <div class="mini-row">
                <div>
                  <div class="mini-title">Pendente total</div>
                  <div class="mini-sub">${pendingBills.length} conta(s) aguardando pagamento</div>
                </div>
                <div class="mini-money">${escapeHtml(formatCurrency(overall.totalPending))}</div>
              </div>
              <div class="mini-row">
                <div>
                  <div class="mini-title">Pago acumulado</div>
                  <div class="mini-sub">${paidBills.length} conta(s) encerradas</div>
                </div>
                <div class="mini-money">${escapeHtml(formatCurrency(overall.totalPaid))}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-grid">
          <div class="card">
            <div class="section-label">Contas em atraso</div>
            <div class="mini-stack" style="margin-top:10px;">
              ${buildHighlightList(overdue, 'Nenhuma conta em atraso.')}
            </div>
          </div>
          <div class="card">
            <div class="section-label">Próximos vencimentos</div>
            <div class="mini-stack" style="margin-top:10px;">
              ${buildHighlightList(upcoming, 'Nenhum vencimento nos próximos 7 dias.')}
            </div>
          </div>
        </div>
      </section>

      <section class="section page-break">
        <div class="card table-card">
          <div class="card-head">
            <div>
              <div class="table-title">Contas pendentes</div>
              <div class="table-meta">${pendingBills.length} lançamento(s) aguardando pagamento</div>
            </div>
            <div class="table-meta">${escapeHtml(formatCurrency(overall.totalPending))}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Conta</th>
                <th>Categoria</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Criada em</th>
              </tr>
            </thead>
            <tbody>
              ${buildTableRows(pendingBills, T)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="section">
        <div class="card table-card">
          <div class="card-head">
            <div>
              <div class="table-title">Contas pagas</div>
              <div class="table-meta">${paidBills.length} lançamento(s) já quitados</div>
            </div>
            <div class="table-meta">${escapeHtml(formatCurrency(overall.totalPaid))}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Conta</th>
                <th>Categoria</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Criada em</th>
              </tr>
            </thead>
            <tbody>
              ${buildTableRows(paidBills, T)}
            </tbody>
          </table>
        </div>
      </section>

      <div class="footer">
        <div>Contas · Relatório financeiro</div>
        <div>${escapeHtml(monthLabel)} · ${escapeHtml(generatedAt)}</div>
      </div>
    </div>
  </body>
</html>
  `;
}

export async function exportFinancialSummaryPdf({
  db,
  T,
  userName,
  defaultDueDay,
}: ExportParams): Promise<ExportResult> {
  const yearMonth = currentYearMonth();
  const [allBills, monthlySummary, upcoming, overdue] = await Promise.all([
    getAllContas(db, 'todas'),
    getMonthlySummary(db, yearMonth),
    getUpcomingContas(db, 7),
    getOverdueContas(db),
  ]);

  const html = buildReportHtml({
    T,
    userName: userName?.trim() || 'Você',
    defaultDueDay,
    yearMonth,
    monthlySummary,
    allBills,
    upcoming,
    overdue,
  });

  if (Platform.OS === 'web') {
    await Print.printToFileAsync({ html });
    return { type: 'print_dialog' };
  }

  const { uri } = await Print.printToFileAsync({
    html,
    margins: { top: 24, right: 24, bottom: 28, left: 24 },
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar resumo em PDF',
    });
    return { type: 'shared', uri };
  }

  return { type: 'saved', uri };
}
