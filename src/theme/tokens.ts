export interface ThemeTokens {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceHi: string;
  surfaceLo: string;
  border: string;
  borderStrong: string;
  text: string;
  textDim: string;
  textFaint: string;
  textGhost: string;
  accent: string;
  accentInk: string;
  danger: string;
  warn: string;
  success: string;
  info: string;
  chipBg: string;
}

export const darkTokens: ThemeTokens = {
  bg: '#0A0A0B',
  bgElevated: '#141416',
  surface: '#1A1A1D',
  surfaceHi: '#222226',
  surfaceLo: '#101012',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.64)',
  textFaint: 'rgba(255,255,255,0.40)',
  textGhost: 'rgba(255,255,255,0.24)',
  accent: '#C5FF4D',
  accentInk: '#0A0A0B',
  danger: '#FF5E5E',
  warn: '#FFB84D',
  success: '#4DE88F',
  info: '#6FA8FF',
  chipBg: 'rgba(255,255,255,0.06)',
};

export const lightTokens: ThemeTokens = {
  bg: '#F4F4F2',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceHi: '#FAFAF8',
  surfaceLo: '#EEEEEC',
  border: 'rgba(10,10,11,0.08)',
  borderStrong: 'rgba(10,10,11,0.16)',
  text: '#0A0A0B',
  textDim: 'rgba(10,10,11,0.64)',
  textFaint: 'rgba(10,10,11,0.40)',
  textGhost: 'rgba(10,10,11,0.20)',
  accent: '#0A0A0B',
  accentInk: '#C5FF4D',
  danger: '#E24545',
  warn: '#D98A1E',
  success: '#1D9E5A',
  info: '#3A7BD9',
  chipBg: 'rgba(10,10,11,0.05)',
};

export interface CategoryInfo {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  moradia:     { label: 'Moradia',      icon: 'home',     color: '#6FA8FF', bg: 'rgba(111,168,255,0.14)' },
  alimentacao: { label: 'Alimentação',  icon: 'utensils', color: '#4DE88F', bg: 'rgba(77,232,143,0.14)' },
  transporte:  { label: 'Transporte',   icon: 'car',      color: '#FFB84D', bg: 'rgba(255,184,77,0.14)' },
  lazer:       { label: 'Lazer',        icon: 'music',    color: '#E07BFF', bg: 'rgba(224,123,255,0.14)' },
  saude:       { label: 'Saúde',        icon: 'heart',    color: '#FF7B9E', bg: 'rgba(255,123,158,0.14)' },
  assinatura:  { label: 'Assinaturas',  icon: 'repeat',   color: '#C5FF4D', bg: 'rgba(197,255,77,0.16)' },
  compras:     { label: 'Compras',      icon: 'bag',      color: '#FF9F6F', bg: 'rgba(255,159,111,0.14)' },
  educacao:    { label: 'Educação',     icon: 'book',     color: '#6FE0FF', bg: 'rgba(111,224,255,0.14)' },
  outros:      { label: 'Outros',       icon: 'dots',     color: '#B8B8C0', bg: 'rgba(184,184,192,0.14)' },
};
