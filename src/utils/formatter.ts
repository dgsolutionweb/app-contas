import type { Conta, SummaryPayload } from '../types';
import { formatDisplayDate } from './dateHelpers';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatAddSuccess(conta: Omit<Conta, 'id' | 'pago' | 'criado_em'>): string {
  return `Conta adicionada! *${conta.descricao}* de ${formatCurrency(conta.valor)} com vencimento em ${formatDisplayDate(conta.vencimento)} (${conta.categoria})`;
}

export function formatAddError(missing: 'valor' | 'data' | 'both'): string {
  if (missing === 'valor') {
    return `Não encontrei o valor. Tente:\n"adicionar aluguel R$1500 para 10/04"`;
  }
  if (missing === 'data') {
    return `Não encontrei a data de vencimento. Tente:\n"adicionar aluguel R$1500 para 10/04"`;
  }
  return `Não entendi o valor ou a data. Tente:\n"adicionar aluguel R$1500 para 10/04"`;
}

export function formatListHeader(
  count: number,
  filtro: 'pendentes' | 'pagas' | 'todas'
): string {
  if (count === 0) {
    const label = filtro === 'pendentes' ? 'pendentes' : filtro === 'pagas' ? 'pagas' : '';
    return `Nenhuma conta ${label} encontrada.`;
  }
  const label = filtro === 'pendentes' ? 'pendente' : filtro === 'pagas' ? 'paga' : '';
  const plural = count === 1 ? `1 conta ${label}` : `${count} contas ${label}`;
  return `Encontrei ${plural}:`;
}

export function formatMarkPaidSuccess(conta: Conta): string {
  return `*${conta.descricao}* marcada como paga!`;
}

export function formatMarkPaidNotFound(query: string): string {
  return `Não encontrei nenhuma conta com "${query}". Use "listar" para ver suas contas.`;
}

export function formatDeleteConfirm(conta: Conta): string {
  return `Tem certeza que quer deletar *${conta.descricao}* (${formatCurrency(conta.valor)})?`;
}

export function formatDeleteSuccess(descricao: string): string {
  return `*${descricao}* removida com sucesso.`;
}

export function formatDeleteNotFound(query: string): string {
  return `Não encontrei nenhuma conta com "${query}". Use "listar" para ver suas contas.`;
}

export function formatSummaryHeader(payload: SummaryPayload): string {
  if (payload.count === 0) {
    return `Nenhuma conta registrada em ${payload.mes}.`;
  }
  return `Resumo de ${payload.mes}:`;
}

export function formatUpcoming(contas: Conta[]): string {
  if (contas.length === 0) return 'Nenhuma conta vence nos próximos 7 dias.';
  return `${contas.length} conta(s) vencem essa semana:`;
}

export function formatOverdue(contas: Conta[]): string {
  if (contas.length === 0) return 'Nenhuma conta em atraso. Tudo em dia!';
  const total = contas.reduce((s, c) => s + c.valor, 0);
  return `${contas.length} conta(s) em atraso, totalizando ${formatCurrency(total)}:`;
}

export function formatPayAll(count: number): string {
  if (count === 0) return 'Não havia contas pendentes.';
  return `${count} conta(s) marcadas como pagas.`;
}

export function formatHelp(): string {
  return `Aqui estão os comandos disponíveis:

*Adicionar conta:*
"adicionar aluguel R$1500 para 10/04"
"netflix 39.90 mensal"
"comprei TV 2000 em 10x"

*Listar contas:*
"listar pendentes" · "listar todas"

*Pagar:*
"paguei aluguel"
"paguei tudo"

*Vencimentos:*
"contas dessa semana"
"contas atrasadas"

*Editar / Remover:*
"editar aluguel" · "deletar internet"

*Resumo:*
"resumo do mês" · "total de abril"

*Buscar:*
"buscar netflix"`;
}

export function formatUnknown(): string {
  return `Não entendi. Você pode me dizer coisas como:
• "adicionar aluguel R$1500 para 10/04"
• "listar pendentes"
• "paguei internet"
• "resumo do mês"

Digite *ajuda* para ver todos os comandos.`;
}

export function formatWelcome(): string {
  return `Olá! Sou seu assistente financeiro pessoal.

Você pode me dizer coisas como:
• "adicionar aluguel R$1500 para 10/04"
• "listar pendentes"
• "paguei internet"
• "resumo do mês"

Digite *ajuda* para ver todos os comandos.`;
}

export function formatSearchResults(contas: Conta[]): string {
  if (contas.length === 0) return 'Nenhuma conta encontrada.';
  return `Encontrei ${contas.length} conta(s):`;
}

export function formatEditConfirm(conta: Conta): string {
  return `Quer editar *${conta.descricao}* (${formatCurrency(conta.valor)}, vence em ${formatDisplayDate(conta.vencimento)})?\n\nPara alterar, diga o novo valor e/ou data.\nEx: "mudar para R$200 dia 20"`;
}

export function formatEditSuccess(descricao: string): string {
  return `*${descricao}* atualizada com sucesso.`;
}

export function formatEditNotFound(query: string): string {
  return `Não encontrei nenhuma conta com "${query}". Use "listar" para ver suas contas.`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  moradia: 'Moradia',
  energia: 'Energia',
  agua: 'Água',
  telecomunicacoes: 'Telecom',
  alimentacao: 'Alimentação',
  cartao: 'Cartão',
  transporte: 'Transporte',
  saude: 'Saúde',
  educacao: 'Educação',
  outros: 'Outros',
};

export const CATEGORY_COLORS: Record<string, string> = {
  moradia: '#7C6AF5',
  energia: '#F5A623',
  agua: '#4A9EF5',
  telecomunicacoes: '#4CAF84',
  alimentacao: '#F5644A',
  cartao: '#E05599',
  transporte: '#5BB8F5',
  saude: '#50C878',
  educacao: '#FF9F40',
  outros: '#888899',
};
