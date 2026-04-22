# Contas

Aplicativo de gerenciamento de finanças pessoais com interface de chat inteligente usando IA (Google Gemini).

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
├── database/       # Configuração SQLite
├── services/       # Integrações (Gemini API)
├── hooks/          # Custom hooks
├── context/          # Context API
├── types/          # TypeScript types
└── utils/          # Funções utilitárias
```

## Tecnologias

- React Native + Expo
- TypeScript
- SQLite (expo-sqlite)
- Google Gemini API
- React Navigation

## Notas sobre Web

O app usa `expo-sqlite` que já tem suporte nativo para web via WebAssembly (WASM). O banco de dados é persistido no IndexedDB do navegador.
