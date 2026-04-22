import type { ParsedIntent } from '../types';
import { parseDate, parseYearMonth, currentYearMonth } from './dateHelpers';

function detectCategory(descricao: string): string {
  const lower = descricao.toLowerCase();
  if (/alugu[ei]l|moradia|condomin/.test(lower)) return 'moradia';
  if (/luz|energia|enel|cemig|copel|coelba|eletro/.test(lower)) return 'moradia';
  if (/[aá]gu[ao]|sanepar|sabesp|caesb|embasa/.test(lower)) return 'moradia';
  if (/internet|tim|claro|vivo|oi\b|net\b|telecom|fibra|banda/.test(lower)) return 'moradia';
  if (/netflix|spotify|disney|amazon|hbo|streaming|prime|deezer|youtube\s+premium/.test(lower)) return 'assinatura';
  if (/academia|smart\s*fit|bio\s*ritmo/.test(lower)) return 'saude';
  if (/mercado|supermercado|ifood|padaria|restaurante|lanche|pizza|sushi/.test(lower)) return 'alimentacao';
  if (/cart[aã]o|nubank|itau|ita[uú]|bradesco|caixa|bb\b|santander|inter|c6/.test(lower)) return 'compras';
  if (/gasolina|combust[ií]vel|posto|carro|uber|99|transporte|metr[oô]|[oô]nibus/.test(lower)) return 'transporte';
  if (/plano|sa[uú]de|m[eé]dico|farm[aá]cia|dentista|hospital|rem[eé]dio/.test(lower)) return 'saude';
  if (/escola|faculdade|curso|mensalidade|educa[cç]/.test(lower)) return 'educacao';
  if (/seguro|iptu|ipva|imposto/.test(lower)) return 'outros';
  if (/lazer|cinema|teatro|show|viagem|hotel|passeio/.test(lower)) return 'lazer';
  return 'outros';
}

function parseValor(raw: string): number | null {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

function extractValorAndRest(text: string): { valor: number | null; rest: string } {
  const patterns = [
    /(?:r\$\s*)([\d.,]+)/i,
    /(?:rs\.?\s*)([\d.,]+)/i,
    /([\d.,]+)\s*(?:reais|r\$)/i,
    /\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/,
    /\b(\d+[.,]\d{2})\b/,
    /\b(\d{2,})\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const valor = parseValor(match[1]);
      if (valor && valor > 0) {
        return { valor, rest: text.replace(match[0], '').trim() };
      }
    }
  }
  return { valor: null, rest: text };
}

function extractParcelas(text: string): { parcelas: number; valorTotal: boolean; rest: string } {
  // "10x", "10 vezes", "em 10 parcelas", "parcelado em 10x"
  const parcelaMatch = text.match(/(\d+)\s*x\b|em\s+(\d+)\s+(?:vezes|parcelas?)|parcelad[oa]\s+(?:em\s+)?(\d+)/i);
  if (parcelaMatch) {
    const n = parseInt(parcelaMatch[1] || parcelaMatch[2] || parcelaMatch[3]);
    if (n > 1) {
      const rest = text.replace(parcelaMatch[0], '').trim();
      // "total de X em 10x" → valor_total = true; "X por mês em 10x" → false
      const isTotal = !/por\s+m[eê]s|mensais|\/m[eê]s|cada\s+(?:parcela|m[eê]s)/.test(text.toLowerCase());
      return { parcelas: n, valorTotal: isTotal, rest };
    }
  }
  return { parcelas: 1, valorTotal: false, rest: text };
}

function isFixedExpense(text: string): boolean {
  return /\b(mensal|todo\s+m[eê]s|recorrente|fixo|fixa|todo\s+ano|anual|sempre|assinatura)\b/i.test(text) ||
    /netflix|spotify|disney|amazon\s+prime|hbo|deezer|youtube\s+premium|academia|smart\s*fit|aluguel|internet|plano/i.test(text.toLowerCase());
}

export function parseMessage(text: string): ParsedIntent {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // ── HELP ──────────────────────────────────────────────────────────────────
  if (/\b(ajuda|help|como usar|comandos|o que voc[eê] faz|o que fazer|menu|op[cç][oõ]es)\b/.test(lower)) {
    return { type: 'help' };
  }

  // ── UPCOMING / NEXT WEEK ──────────────────────────────────────────────────
  if (/\b(essa semana|esta semana|pr[oó]ximos?\s+\d+\s+dias?|vence\s+essa\s+semana|pr[oó]ximos?\s+vencimentos?)\b/.test(lower)) {
    return { type: 'upcoming' };
  }

  // ── OVERDUE ───────────────────────────────────────────────────────────────
  if (/\b(atrasad[ao]s?|vencid[ao]s?|em\s+atraso|passou\s+do\s+prazo)\b/.test(lower)) {
    return { type: 'overdue' };
  }

  // ── PAY ALL ───────────────────────────────────────────────────────────────
  if (/\b(pagar?\s+tudo|quitar?\s+tudo|marcar?\s+tud[ao]\s+como\s+pag[ao]|paguei\s+tudo|paguei\s+todas)\b/.test(lower)) {
    return { type: 'pay_all' };
  }

  // ── EDIT VALUE (response to edit prompt) ─────────────────────────────────
  if (/^\s*(r\$|rs\.?)?\s*[\d.,]+\s*(reais)?\s*(dia\s+\d{1,2}|para\s+\d{1,2}[\/\-]|vence\s+)?.*/i.test(trimmed) &&
    /\b(dia|para|vence|mudar|alterar|novo valor)\b/i.test(lower)) {
    const { valor } = extractValorAndRest(trimmed);
    const datePattern = /(dia\s+\d{1,2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|hoje|amanha|amanhã|depois de amanha|depois de amanhã|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)/i;
    const dateMatch = trimmed.match(datePattern);
    const vencimento = dateMatch ? (parseDate(dateMatch[1]) ?? '') : '';
    if (valor) return { type: 'edit_value', valor, vencimento };
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────
  if (/^(editar|alterar|modificar|mudar|atualizar)\s+/i.test(trimmed)) {
    const query = trimmed.replace(/^(editar|alterar|modificar|mudar|atualizar)\s+/i, '').trim();
    return { type: 'edit', query };
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────
  if (/^(buscar|procurar|pesquisar|encontrar|achar|search)\s+/i.test(trimmed)) {
    const query = trimmed.replace(/^(buscar|procurar|pesquisar|encontrar|achar|search)\s+/i, '').trim();
    return { type: 'search', query };
  }

  // ── ADD ───────────────────────────────────────────────────────────────────
  if (/^(adicionar?|add|nova conta|lan[cç]ar|registrar|incluir|criar|cadastrar|comprei|fiz|gastei|paguei\s+\d|lancei)\b/i.test(trimmed)) {
    const withoutVerb = trimmed.replace(/^(adicionar?|add|nova conta|lan[cç]ar|registrar|incluir|criar|cadastrar|comprei\s+um?|fiz\s+uma?\s+compra\s+de|gastei|paguei\s+(?=\d)|lancei)\s*/i, '');

    const { valor, rest: afterValor } = extractValorAndRest(withoutVerb);
    if (!valor) {
      const descricao = withoutVerb.replace(/\s+(de|da|do|para|com|em|a|o)$/i, '').trim() || 'Conta';
      return { type: 'add', descricao, valor: 0, vencimento: '', categoria: detectCategory(descricao) };
    }

    const { parcelas, valorTotal, rest: afterParcelas } = extractParcelas(afterValor);
    const fixa = isFixedExpense(withoutVerb);

    const datePattern = /(dia\s+\d{1,2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|hoje|amanha|amanhã|depois de amanha|depois de amanhã|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)/i;
    const dateMatch = afterParcelas.match(datePattern);
    const vencimento = dateMatch ? (parseDate(dateMatch[1]) ?? '') : '';

    let descricao = afterParcelas.replace(datePattern, '').trim();
    descricao = descricao.replace(/\s+(de|da|do|para|com|em|a|o|no|na|dia|vence|vencimento)\s*$/i, '').trim();
    if (!descricao) descricao = 'Conta';

    return { type: 'add', descricao, valor, vencimento, categoria: detectCategory(descricao), parcelas, fixa, valor_total: valorTotal };
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (/^(deletar|remover|apagar|excluir|cancelar conta)\s+/i.test(trimmed)) {
    const query = trimmed.replace(/^(deletar|remover|apagar|excluir|cancelar conta)\s+/i, '').trim();
    return { type: 'delete', query };
  }

  // ── MARK PAID ─────────────────────────────────────────────────────────────
  if (/\b(paguei|quitei|quitar|marcar.*pag[oa]|liquidar)\b/i.test(lower)) {
    let query = trimmed
      .replace(/^(paguei|quitei|quitar|liquidar)\s+/i, '')
      .replace(/\s+(como\s+pag[oa]|como\s+quit[ao]d[ao])\s*/i, '')
      .trim();
    const marcarMatch = trimmed.match(/marcar\s+(.+?)\s+como\s+pag[oa]/i);
    if (marcarMatch) query = marcarMatch[1].trim();
    return { type: 'mark_paid', query };
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (/\b(resumo|total|balan[cç]o|relat[oó]rio|quanto\s+(?:falta|gastei|paguei|devo)|gastos?|fechamento|fechar\s+m[eê]s)\b/.test(lower)) {
    const yearMonth = parseYearMonth(trimmed);
    return { type: 'summary', yearMonth };
  }

  // ── LIST ──────────────────────────────────────────────────────────────────
  if (/\b(listar|ver|mostrar|quais|minhas\s+contas|contas\s+do\s+m[eê]s|exibir)\b/.test(lower)) {
    let filtro: 'pendentes' | 'pagas' | 'todas' = 'todas';
    if (/\b(pendentes?|abertas?|a pagar|em aberto|devendo)\b/.test(lower)) filtro = 'pendentes';
    if (/\b(pagas?|quitadas?|pagos)\b/.test(lower)) filtro = 'pagas';
    return { type: 'list', filtro };
  }

  return { type: 'unknown' };
}
