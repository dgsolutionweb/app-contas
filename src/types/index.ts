export interface Conta {
  id: number;
  descricao: string;
  valor: number;
  vencimento: string; // 'YYYY-MM-DD'
  categoria: string;
  pago: 0 | 1;
  recorrente: 0 | 1;
  nota?: string;
  criado_em: string;
}

export type MessageRole = 'user' | 'bot';
export type MessageTipo = 'text' | 'bill_list' | 'summary' | 'confirm' | 'error';

export interface BillListPayload {
  contas: Conta[];
}

export interface SummaryPayload {
  mes: string;
  yearMonth: string; // 'YYYY-MM'
  total: number;
  totalPago: number;
  totalPendente: number;
  count: number;
  countPago: number;
  porCategoria: { categoria: string; total: number }[];
}

export interface ConfirmPayload {
  action: 'delete' | 'mark_paid' | 'edit';
  contaId: number;
  descricao: string;
  currentValor?: number;
  currentVencimento?: string;
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  content: string;
  tipo: MessageTipo;
  payload?: BillListPayload | SummaryPayload | ConfirmPayload;
  criado_em: string;
}

export type ParsedIntent =
  | { type: 'add'; descricao: string; valor: number; vencimento: string; categoria: string; parcelas?: number; fixa?: boolean; valor_total?: boolean }
  | { type: 'list'; filtro: 'pendentes' | 'pagas' | 'todas' }
  | { type: 'mark_paid'; query: string }
  | { type: 'delete'; query: string }
  | { type: 'edit'; query: string }
  | { type: 'edit_value'; valor: number; vencimento?: string }
  | { type: 'search'; query: string }
  | { type: 'summary'; yearMonth: string }
  | { type: 'upcoming' }
  | { type: 'overdue' }
  | { type: 'pay_all' }
  | { type: 'help' }
  | { type: 'unknown' };

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  bot: string;
  text: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
}

export interface AppSettings {
  defaultDueDay: number;
  cardClosingDay: number;
  geminiApiKey: string;
  userName: string;
}
