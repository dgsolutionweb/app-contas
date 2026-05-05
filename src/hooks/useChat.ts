import { useState, useEffect, useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ChatMessage, ConfirmPayload, AppSettings } from '../types';
import { saveMessage, getAllMessages, countMessages, clearHistory } from '../database/messagesRepository';
import {
  addConta,
  updateConta,
  getAllContas,
  searchContas,
  markAsPaid,
  deleteConta,
  getMonthlySummary,
  getUpcomingContas,
  getOverdueContas,
  payAllPending,
} from '../database/contasRepository';
import { parseMessage } from '../utils/parser';
import { getDefaultDueDate, currentYearMonth, addMonthsToISO } from '../utils/dateHelpers';
import { parseWithGemini } from '../services/gemini';
import {
  formatAddSuccess,
  formatAddError,
  formatListHeader,
  formatMarkPaidSuccess,
  formatMarkPaidNotFound,
  formatDeleteConfirm,
  formatDeleteSuccess,
  formatDeleteNotFound,
  formatSummaryHeader,
  formatHelp,
  formatUnknown,
  formatWelcome,
  formatSearchResults,
  formatEditConfirm,
  formatEditSuccess,
  formatEditNotFound,
  formatUpcoming,
  formatOverdue,
  formatPayAll,
} from '../utils/formatter';

function makeId() {
  return Date.now() + Math.random();
}

export function useChat(db: SQLiteDatabase | null, settings: AppSettings) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ contaId: number; descricao: string } | null>(null);

  // Load persisted messages on mount and insert welcome if first time
  useEffect(() => {
    if (!db) return;

    async function init() {
      try {
        const count = await countMessages(db!);
        if (count === 0) {
          const welcomeMsg: Omit<ChatMessage, 'id'> = {
            role: 'bot',
            content: formatWelcome(),
            tipo: 'text',
            criado_em: new Date().toISOString(),
          };
          const id = await saveMessage(db!, welcomeMsg);
          setMessages([{ ...welcomeMsg, id }]);
        } else {
          const saved = await getAllMessages(db!);
          setMessages(saved);
        }
      } catch (err) {
        console.error('useChat init error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [db]);

  const addMessage = useCallback(
    async (msg: Omit<ChatMessage, 'id'>): Promise<ChatMessage> => {
      const id = db ? await saveMessage(db, msg) : makeId();
      const full: ChatMessage = { ...msg, id };
      setMessages((prev) => [...prev, full]);
      return full;
    },
    [db]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!db || !text.trim()) return;

      setIsProcessing(true);

      // 1. Save user message
      await addMessage({
        role: 'user',
        content: text.trim(),
        tipo: 'text',
        criado_em: new Date().toISOString(),
      });

      // 2. Handle special commands
      if (text.trim().toLowerCase() === '/clear') {
        await clearHistory(db);
        setMessages([]);
        const welcomeMsg: Omit<ChatMessage, 'id'> = {
          role: 'bot',
          content: formatWelcome(),
          tipo: 'text',
          criado_em: new Date().toISOString(),
        };
        const id = await saveMessage(db, welcomeMsg);
        setMessages([{ ...welcomeMsg, id }]);
        setIsProcessing(false);
        return;
      }

      // 3. If user is responding to an edit prompt, route to edit_value intent
      let forceEditValue = false;
      if (pendingEdit) {
        const localParsed = parseMessage(text);
        if (localParsed.type !== 'edit_value') {
          // Try to extract a value/date anyway
          forceEditValue = true;
        }
      }

      // Parse intent - try Gemini first if API key is set, fallback to local parser
      let intent = await parseWithGemini(text, settings.geminiApiKey);
      if (!intent) {
        intent = parseMessage(text);
      }

      // If we have a pending edit and got unknown/other, force edit_value parse
      if (pendingEdit && forceEditValue && intent.type !== 'edit_value') {
        const local = parseMessage(text);
        if (local.type === 'edit_value') intent = local;
      }

      // 3. Handle intent
      try {
        switch (intent.type) {
          case 'add': {
            if (!intent.valor || intent.valor <= 0) {
              await addMessage({
                role: 'bot',
                content: formatAddError('valor'),
                tipo: 'error',
                criado_em: new Date().toISOString(),
              });
              break;
            }
            let vencimento = intent.vencimento;
            if (!vencimento) {
              vencimento = getDefaultDueDate(settings.defaultDueDay, settings.cardClosingDay);
            }

            const parcelas = intent.hasOwnProperty('parcelas') && Number(intent.parcelas) > 1 ? Number(intent.parcelas) : 1;
            const isFixa = intent.fixa === true;
            const isTotal = intent.valor_total === true;
            
            const valorCalculado = isTotal && parcelas > 1 ? Number((intent.valor / parcelas).toFixed(2)) : intent.valor;
            const iteracoes = isFixa ? 12 : parcelas;

            if (iteracoes === 1) {
              await addConta(db, {
                descricao: intent.descricao,
                valor: valorCalculado,
                vencimento,
                categoria: intent.categoria,
                recorrente: isFixa ? 1 : 0,
              });
            } else {
              for (let i = 0; i < iteracoes; i++) {
                const mesVencimento = addMonthsToISO(vencimento, i);
                let nome = intent.descricao;
                if (!isFixa) {
                  nome = `${intent.descricao} (${i + 1}/${parcelas})`;
                }
                await addConta(db, {
                  descricao: nome,
                  valor: valorCalculado,
                  vencimento: mesVencimento,
                  categoria: intent.categoria,
                  recorrente: isFixa ? 1 : 0,
                });
              }
            }

            let msgSuffix = '';
            if (isFixa) {
              msgSuffix = ' (cadastrada para os próximos 12 meses)';
            } else if (parcelas > 1) {
              msgSuffix = ` (em ${parcelas}x de R$ ${valorCalculado.toFixed(2).replace('.', ',')})`;
            }

            await addMessage({
              role: 'bot',
              content: formatAddSuccess({ ...intent, vencimento, recorrente: isFixa ? 1 : 0 }) + msgSuffix,
              tipo: 'text',
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'list': {
            const contas = await getAllContas(db, intent.filtro);
            await addMessage({
              role: 'bot',
              content: formatListHeader(contas.length, intent.filtro),
              tipo: contas.length > 0 ? 'bill_list' : 'text',
              payload: contas.length > 0 ? { contas } : undefined,
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'mark_paid': {
            const found = await searchContas(db, intent.query);
            if (found.length === 0) {
              await addMessage({
                role: 'bot',
                content: formatMarkPaidNotFound(intent.query),
                tipo: 'text',
                criado_em: new Date().toISOString(),
              });
            } else {
              const conta = found[0];
              await markAsPaid(db, conta.id);
              await addMessage({
                role: 'bot',
                content: formatMarkPaidSuccess(conta),
                tipo: 'text',
                criado_em: new Date().toISOString(),
              });
            }
            break;
          }

          case 'delete': {
            const found = await searchContas(db, intent.query);
            if (found.length === 0) {
              await addMessage({
                role: 'bot',
                content: formatDeleteNotFound(intent.query),
                tipo: 'text',
                criado_em: new Date().toISOString(),
              });
            } else {
              const conta = found[0];
              const payload: ConfirmPayload = {
                action: 'delete',
                contaId: conta.id,
                descricao: conta.descricao,
              };
              await addMessage({
                role: 'bot',
                content: formatDeleteConfirm(conta),
                tipo: 'confirm',
                payload,
                criado_em: new Date().toISOString(),
              });
            }
            break;
          }

          case 'summary': {
            const yearMonth = intent.yearMonth || currentYearMonth();
            const payload = await getMonthlySummary(db, yearMonth);
            await addMessage({
              role: 'bot',
              content: formatSummaryHeader(payload),
              tipo: payload.count > 0 ? 'summary' : 'text',
              payload: payload.count > 0 ? payload : undefined,
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'search': {
            const found = await searchContas(db, intent.query);
            if (found.length === 0) {
              await addMessage({
                role: 'bot',
                content: `Nenhuma conta encontrada para "${intent.query}".`,
                tipo: 'text',
                criado_em: new Date().toISOString(),
              });
            } else {
              await addMessage({
                role: 'bot',
                content: formatSearchResults(found),
                tipo: 'bill_list',
                payload: { contas: found },
                criado_em: new Date().toISOString(),
              });
            }
            break;
          }

          case 'edit': {
            const found = await searchContas(db, intent.query);
            if (found.length === 0) {
              await addMessage({
                role: 'bot',
                content: formatEditNotFound(intent.query),
                tipo: 'text',
                criado_em: new Date().toISOString(),
              });
            } else {
              const conta = found[0];
              const payload: ConfirmPayload = {
                action: 'edit',
                contaId: conta.id,
                descricao: conta.descricao,
                currentValor: conta.valor,
                currentVencimento: conta.vencimento,
              };
              await addMessage({
                role: 'bot',
                content: formatEditConfirm(conta),
                tipo: 'confirm',
                payload,
                criado_em: new Date().toISOString(),
              });
            }
            break;
          }

          case 'edit_value': {
            if (!pendingEdit) {
              await addMessage({
                role: 'bot',
                content: 'Nenhuma conta selecionada para edição. Diga "editar [nome]" primeiro.',
                tipo: 'text',
                criado_em: new Date().toISOString(),
              });
              break;
            }
            const updateData: any = {};
            if (intent.valor) updateData.valor = intent.valor;
            if (intent.vencimento) updateData.vencimento = intent.vencimento;
            await updateConta(db, pendingEdit.contaId, updateData);
            const editedName = pendingEdit.descricao;
            setPendingEdit(null);
            await addMessage({
              role: 'bot',
              content: formatEditSuccess(editedName),
              tipo: 'text',
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'upcoming': {
            const upcoming = await getUpcomingContas(db, 7);
            await addMessage({
              role: 'bot',
              content: formatUpcoming(upcoming),
              tipo: upcoming.length > 0 ? 'bill_list' : 'text',
              payload: upcoming.length > 0 ? { contas: upcoming } : undefined,
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'overdue': {
            const overdue = await getOverdueContas(db);
            await addMessage({
              role: 'bot',
              content: formatOverdue(overdue),
              tipo: overdue.length > 0 ? 'bill_list' : 'text',
              payload: overdue.length > 0 ? { contas: overdue } : undefined,
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'pay_all': {
            const changed = await payAllPending(db);
            await addMessage({
              role: 'bot',
              content: formatPayAll(changed),
              tipo: 'text',
              criado_em: new Date().toISOString(),
            });
            break;
          }

          case 'help': {
            await addMessage({
              role: 'bot',
              content: formatHelp(),
              tipo: 'text',
              criado_em: new Date().toISOString(),
            });
            break;
          }

          default: {
            await addMessage({
              role: 'bot',
              content: formatUnknown(),
              tipo: 'text',
              criado_em: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('useChat sendMessage error:', err);
        await addMessage({
          role: 'bot',
          content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
          tipo: 'error',
          criado_em: new Date().toISOString(),
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [db, addMessage, settings.geminiApiKey, settings.defaultDueDay, settings.cardClosingDay, pendingEdit]
  );

  const handleConfirm = useCallback(
    async (payload: ConfirmPayload) => {
      if (!db) return;
      try {
        if (payload.action === 'delete') {
          await deleteConta(db, payload.contaId);
          await addMessage({
            role: 'bot',
            content: formatDeleteSuccess(payload.descricao),
            tipo: 'text',
            criado_em: new Date().toISOString(),
          });
        } else if (payload.action === 'mark_paid') {
          await markAsPaid(db, payload.contaId);
          await addMessage({
            role: 'bot',
            content: `*${payload.descricao}* marcada como paga!`,
            tipo: 'text',
            criado_em: new Date().toISOString(),
          });
        } else if (payload.action === 'edit') {
          setPendingEdit({ contaId: payload.contaId, descricao: payload.descricao });
          await addMessage({
            role: 'bot',
            content: `Ok, editando *${payload.descricao}*. Envie o novo valor e/ou vencimento.\nEx: "R$200 dia 20" ou "250" ou "dia 15"`,
            tipo: 'text',
            criado_em: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('handleConfirm error:', err);
      }
    },
    [db, addMessage]
  );

  const handleCancel = useCallback(async () => {
    setPendingEdit(null);
    await addMessage({
      role: 'bot',
      content: 'Ação cancelada.',
      tipo: 'text',
      criado_em: new Date().toISOString(),
    });
  }, [addMessage]);

  const clearChat = useCallback(async () => {
    if (!db) return;
    await clearHistory(db);
    setMessages([]);
    const welcomeMsg: Omit<ChatMessage, 'id'> = {
      role: 'bot',
      content: formatWelcome(),
      tipo: 'text',
      criado_em: new Date().toISOString(),
    };
    const id = await saveMessage(db, welcomeMsg);
    setMessages([{ ...welcomeMsg, id }]);
  }, [db]);

  return { messages, isLoading, isProcessing, sendMessage, handleConfirm, handleCancel, clearChat };
}
