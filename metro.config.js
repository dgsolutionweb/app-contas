const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adicionar suporte para arquivos WASM
config.resolver.assetExts.push('wasm');

module.exports = config;
