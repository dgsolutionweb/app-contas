import type { ParsedIntent } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `Você é um assistente financeiro que gerencia contas (despesas) pessoais. Sua tarefa é interpretar mensagens em português brasileiro e retornar uma intenção estruturada em JSON.

Intents disponíveis:

1. **add** - Adicionar uma conta/despesa
   Campos: descricao, valor (número), vencimento (YYYY-MM-DD ou ""), categoria, parcelas (int, padrão 1), fixa (bool, padrão false), valor_total (bool: true se valor é o total parcelado)
   Categorias: moradia, alimentacao, transporte, saude, educacao, assinatura, compras, lazer, outros
   - "comprei pizza 45 reais" → add, descricao: "pizza", valor: 45, categoria: "alimentacao"
   - "TV 2000 em 10x" → add, descricao: "TV", valor: 2000, parcelas: 10, valor_total: true
   - "netflix 39.90 mensal" → add, descricao: "netflix", valor: 39.90, categoria: "assinatura", fixa: true

2. **list** - Listar contas
   Campos: filtro ("pendentes" | "pagas" | "todas")
   - "contas pendentes" → list, filtro: "pendentes"

3. **mark_paid** - Marcar conta como paga
   Campos: query (nome da conta)
   - "paguei aluguel" → mark_paid, query: "aluguel"

4. **pay_all** - Marcar todas as contas pendentes como pagas
   - "paguei tudo" / "quitar tudo" → pay_all

5. **delete** - Deletar conta
   Campos: query
   - "deletar spotify" → delete, query: "spotify"

6. **edit** - Editar uma conta (inicia fluxo de edição)
   Campos: query (nome da conta)
   - "editar aluguel" → edit, query: "aluguel"

7. **edit_value** - Resposta ao fluxo de edição (novo valor e/ou data)
   Campos: valor (número, opcional), vencimento (YYYY-MM-DD, opcional)
   - "200 reais dia 15" → edit_value, valor: 200, vencimento: "YYYY-MM-15"
   - "R$350" → edit_value, valor: 350

8. **summary** - Resumo mensal
   Campos: yearMonth ("YYYY-MM" ou "")
   - "resumo de março" → summary, yearMonth: "2026-03"

9. **search** - Buscar contas
   Campos: query
   - "buscar energia" → search, query: "energia"

10. **upcoming** - Contas que vencem em breve (próximos 7 dias)
    - "contas dessa semana" / "próximos vencimentos" → upcoming

11. **overdue** - Contas em atraso
    - "contas atrasadas" / "em atraso" → overdue

12. **help** - Ajuda sobre comandos

13. **unknown** - Não entendeu

Retorne APENAS JSON válido sem markdown. Exemplos:
{"type":"add","descricao":"","valor":0,"vencimento":"","categoria":"outros","parcelas":1,"fixa":false,"valor_total":false}
{"type":"list","filtro":"todas"}
{"type":"mark_paid","query":""}
{"type":"pay_all"}
{"type":"delete","query":""}
{"type":"edit","query":""}
{"type":"edit_value","valor":0,"vencimento":""}
{"type":"summary","yearMonth":""}
{"type":"search","query":""}
{"type":"upcoming"}
{"type":"overdue"}
{"type":"help"}
{"type":"unknown"}

Datas: sempre YYYY-MM-DD. "hoje"/"amanhã"/"ontem" → data real. Sem data → "".
`;

export async function parseWithGemini(text: string, apiKey: string): Promise<ParsedIntent | null> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT + '\n\nMensagem do usuário: ' + text }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return null;

    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return parsed as ParsedIntent;
  } catch {
    return null;
  }
}
