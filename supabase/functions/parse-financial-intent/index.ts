// Supabase Edge Function: parse-financial-intent
// Converte mensagens em linguagem natural (pt-BR) em intents estruturados do app.
// Deploy: via Supabase Management API ou `npx supabase functions deploy parse-financial-intent`
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const intentTypes = [
  "add", "list", "mark_paid", "pay_all", "delete", "edit", "edit_value",
  "summary", "search", "upcoming", "overdue", "compare_months",
  "top_expenses", "category_analysis", "forecast", "insights", "help", "unknown",
];

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: intentTypes },
    descricao: { type: "string" },
    valor: { type: "number" },
    vencimento: { type: "string" },
    categoria: {
      type: "string",
      enum: ["moradia", "alimentacao", "transporte", "saude", "educacao", "assinatura", "compras", "lazer", "outros"],
    },
    parcelas: { type: "integer", minimum: 1, maximum: 120 },
    fixa: { type: "boolean" },
    valor_total: { type: "boolean" },
    filtro: { type: "string", enum: ["pendentes", "pagas", "todas"] },
    query: { type: "string" },
    yearMonth: { type: "string" },
    limit: { type: "integer", minimum: 1, maximum: 20 },
    months: { type: "integer", minimum: 1, maximum: 12 },
  },
  required: [
    "type", "descricao", "valor", "vencimento", "categoria", "parcelas",
    "fixa", "valor_total", "filtro", "query", "yearMonth", "limit", "months",
  ],
};

const systemPrompt = `Voce e o motor de entendimento do "Contas", um assistente financeiro pessoal brasileiro. Sua tarefa: interpretar a mensagem do usuario e escolher exatamente UMA intencao, preenchendo todos os campos do schema. Campos irrelevantes usam string vazia, zero, false ou o padrao indicado.

Aja como uma assistente real: entenda a INTENCAO mesmo que a frase nao siga padrao nenhum — girias, abreviacoes, erros de digitacao, mensagens ditadas por voz sem pontuacao, frases incompletas. Use "unknown" SOMENTE quando a mensagem nao tiver relacao alguma com financas (saudacao pura, assunto aleatorio). Se houver saudacao + pedido financeiro, atenda o pedido.

# Intencoes

- add: cadastrar despesa/conta/gasto. Use quando mencionar gasto novo, compra, boleto que chegou, assinatura nova. Tambem quando disser que JA PAGOU algo novo ("paguei 50 de uber hoje" = add, nao mark_paid — mark_paid e so para conta ja cadastrada).
  - descricao: curta e capitalizada ("Luz", "Notebook", "Netflix").
  - parcelas: "12x de 250" => valor=250, parcelas=12, valor_total=false. "3000 em 10x" / "parcelei 3000 em 10 vezes" => valor=3000, parcelas=10, valor_total=true.
  - fixa=true quando disser "todo mes", "mensal", "fixa", "assinatura", "recorrente".
- list: listar contas. "minhas contas", "o que tenho pra pagar" => filtro=pendentes; "o que ja paguei" => pagas; "todas as contas" => todas.
- mark_paid: marcar conta EXISTENTE como paga. "paguei a luz", "quita a internet". query = nome aproximado.
- pay_all: "paguei tudo", "quita todas".
- delete: remover conta. "apaga a academia", "tira a hbo da lista", "cancela a netflix" (cancelar assinatura = delete).
- edit: iniciar edicao pelo nome. "muda a conta de luz", "corrige o aluguel".
- edit_value: mensagem que e apenas novo valor e/ou data durante edicao ("180", "200 dia 20", "agora e 1500").
- summary: resumo/total de um mes. "quanto gastei esse mes", "fechamento de maio", "resumo". yearMonth YYYY-MM ("" = mes atual).
- search: localizar conta pelo nome. "quanto ta a luz?", "tenho conta da net?".
- upcoming: proximos vencimentos. "o que vence essa semana", "o que ta chegando", "vence algo amanha?".
- overdue: vencidas. "to devendo algo?", "contas atrasadas", "o que venceu e nao paguei".
- compare_months: comparar meses. "gastei mais que mes passado?", "compara junho com maio".
- top_expenses: maiores gastos. "top 3 despesas", "o que pesa mais no bolso". limit solicitado ou 5.
- category_analysis: gastos por categoria. "quanto vai pra comida", "divide meus gastos".
- forecast: previsao futura. "como fica meu proximo mes", "quanto vou gastar". months solicitado ou 3.
- insights: diagnostico e economia. "me da dicas", "to gastando muito?", "como economizar".
- help: "o que voce faz", "ajuda", "comandos".
- unknown: nada financeiro.

# Datas (resolver com a data local fornecida)
- "amanha" = +1 dia; "depois de amanha" = +2; "semana que vem" = +7.
- "dia 15" = dia 15 do mes atual; se ja passou, do mes seguinte.
- "sexta" = proxima sexta-feira; "fim do mes" = ultimo dia do mes.
- "vence em 3 dias" = data local +3. Mes por nome ("em julho") => ano corrente.
- Nao invente valor nem data. Em add sem data, vencimento="".
- "mes passado" em summary/compare => yearMonth do mes anterior.

# Valores (formato brasileiro)
- ponto = milhar, virgula = decimal: "1.200,50" = 1200.5; "99,90" = 99.9.
- "1200 reais" = 1200; "1,5 mil" = 1500; "mil e duzentos" = 1200.

# Categorias (escolher a mais provavel pela descricao)
- moradia: aluguel, luz, energia, agua, gas, condominio, internet, IPTU, faxina
- alimentacao: mercado, supermercado, ifood, restaurante, lanche, padaria, feira
- transporte: uber, 99, gasolina, combustivel, onibus, metro, IPVA, estacionamento, mecanico
- saude: farmacia, remedio, medico, dentista, plano de saude, academia, psicologo
- educacao: faculdade, curso, escola, livro, material
- assinatura: netflix, spotify, prime, disney, youtube premium, icloud, apps mensais
- compras: roupa, tenis, celular, notebook, presente, shopping, eletrodomestico
- lazer: cinema, show, bar, viagem, festa, jogo
- outros: quando nada encaixar

# Exemplos
- "luz 180 vence dia 15" => add, descricao="Luz", valor=180, vencimento=dia 15 deste/proximo mes, categoria=moradia
- "assinei a netflix por 39,90 todo mes" => add, descricao="Netflix", valor=39.9, fixa=true, categoria=assinatura
- "comprei um notebook em 12x de 250" => add, valor=250, parcelas=12, valor_total=false, categoria=compras
- "parcelei 3000 da geladeira em 10 vezes" => add, valor=3000, parcelas=10, valor_total=true
- "ja paguei a academia" => mark_paid, query="academia"
- "quanto gastei mes passado" => summary, yearMonth=mes anterior
- "oi tudo bem? me mostra o que vence essa semana" => upcoming
- "bom dia" => unknown
- "to gastando muito?" => insights

Nao responda ao usuario; produza apenas o objeto estruturado.`;

function outputText(data: any): string | null {
  if (typeof data?.output_text === "string") return data.output_text;
  for (const item of data?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const token = authorization.slice(7);
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: apiKey, error: keyError } = await client.rpc("api_get_openai_key", {
    target_user_id: userData.user.id,
  });
  if (keyError || !apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured for this user" }), {
      status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const localDate = typeof body?.localDate === "string" ? body.localDate : "";
    if (!text || text.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5.5",
        reasoning: { effort: "low" },
        max_output_tokens: 600,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Data local: ${localDate}. Mensagem: ${text}` },
        ],
        text: {
          verbosity: "low",
          format: { type: "json_schema", name: "financial_intent", strict: true, schema },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI request failed", response.status, detail.slice(0, 500));
      return new Response(JSON.stringify({ error: "AI provider request failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const output = outputText(await response.json());
    if (!output) throw new Error("Missing structured output");
    return new Response(JSON.stringify({ intent: JSON.parse(output) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-financial-intent failed", error);
    return new Response(JSON.stringify({ error: "Unable to parse message" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
