# Contas

Aplicativo de gerenciamento de finanças pessoais com interface de chat inteligente usando OpenAI.

## Plataformas Suportadas

- **iOS** - via Expo
- **Android** - via Expo
- **Web** - via navegador

## Comandos

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento (escolha a plataforma no terminal)
npm start

# Android
npm run android

# iOS
npm run ios

# Web (desenvolvimento)
npm run web
```

### Build para Produção

```bash
# Build web estático
npm run web:build

# Servir build localmente
npm run web:serve

# Build nativos via EAS
npm run build:android
npm run build:ios
npm run build:web
```

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── screens/        # Telas do app
├── database/       # Repositórios do Supabase
├── services/       # Integrações com Supabase e OpenAI
├── hooks/          # Custom hooks
├── context/          # Context API
├── types/          # TypeScript types
└── utils/          # Funções utilitárias
```

## Tecnologias

- React Native + Expo
- TypeScript
- Supabase Auth, Database e Edge Functions
- OpenAI Responses API com Structured Outputs
- React Navigation

## Notas sobre Web

O app usa o mesmo projeto Expo nas plataformas nativas e web. Em telas com 900 px ou mais, a interface troca a navegação inferior por uma barra lateral e limita a largura do conteúdo para uso confortável em desktop.

Os dados são lidos e gravados no Supabase, portanto Android e web exibem a mesma base. As variáveis abaixo precisam existir no ambiente local e no projeto da Vercel:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### Deploy na Vercel

O arquivo `vercel.json` já configura o build estático e o fallback de rotas:

```bash
npm run web:build
```

Na Vercel, cadastre as duas variáveis `EXPO_PUBLIC_SUPABASE_*` antes do primeiro deploy. A chave pública do Supabase pode ficar no cliente porque as tabelas `contas`, `messages` e `settings` usam RLS e vinculam cada registro ao usuário autenticado.

O primeiro usuário criado recebe os registros legados que existiam antes da autenticação. Faça esse primeiro cadastro antes de publicar o endereço do app.

### Assistente OpenAI

A chave da OpenAI é cadastrada individualmente em **Perfil → Inteligência artificial**. Ela é enviada por uma Edge Function autenticada, criptografada no Supabase Vault e vinculada ao usuário. Depois de salva, a chave não pode ser consultada novamente pelo navegador.

Sem uma chave cadastrada, o chat continua funcionando com o interpretador local. Com a OpenAI ativa, o app usa GPT-5.5 e Structured Outputs para compreender linguagem natural, mantendo todas as alterações e cálculos financeiros sob controle determinístico do aplicativo.

Além dos comandos de cadastro, edição, pagamento e busca, o assistente oferece:

- comparação entre o mês atual e o anterior;
- maiores despesas do mês;
- análise por categoria;
- projeção das contas dos próximos meses;
- diagnóstico financeiro e oportunidades de economia.
