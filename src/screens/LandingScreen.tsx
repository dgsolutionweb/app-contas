import React from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { Icon } from '../components/ui/Icon';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../theme/tokens';

interface LandingScreenProps {
  onEnter: () => void;
}

const STEPS = [
  {
    icon: 'chat',
    step: '01',
    title: 'Converse',
    text: 'Digite ou fale como se fosse uma mensagem: "luz 180 reais vence dia 15". Sem formulários, sem planilhas.',
  },
  {
    icon: 'sparkle',
    step: '02',
    title: 'A IA organiza',
    text: 'O assistente entende valor, vencimento e categoria automaticamente e registra a conta pra você.',
  },
  {
    icon: 'trend',
    step: '03',
    title: 'Acompanhe',
    text: 'Veja o que vence essa semana, quanto já foi pago e resumos do mês em um painel claro e direto.',
  },
];

const FEATURES = [
  {
    icon: 'sparkle',
    title: 'Chat com IA',
    text: 'Registre, consulte e pague contas conversando em linguagem natural, por texto ou voz.',
  },
  {
    icon: 'tag',
    title: 'Categorias automáticas',
    text: 'Moradia, alimentação, transporte e mais — cada conta classificada sem esforço.',
  },
  {
    icon: 'bell',
    title: 'Vencimentos em dia',
    text: 'Painel mostra o que vence hoje, essa semana e o que está atrasado, sem surpresas.',
  },
  {
    icon: 'repeat',
    title: 'Contas recorrentes',
    text: 'Assinaturas e contas fixas se repetem sozinhas todo mês. Cadastre uma vez só.',
  },
  {
    icon: 'pie',
    title: 'Resumos e insights',
    text: 'Total do mês, gastos por categoria e dicas sobre seu padrão de gastos.',
  },
  {
    icon: 'globe',
    title: 'Android e web',
    text: 'Seus dados sincronizados entre o celular e o navegador, sempre atualizados.',
  },
];

const CHAT_DEMO = [
  { role: 'user' as const, text: 'paguei a internet, 120 reais' },
  { role: 'bot' as const, text: 'Conta registrada e marcada como paga ✓' },
  { role: 'user' as const, text: 'o que vence essa semana?' },
  { role: 'bot' as const, text: '2 contas: Energia (R$ 180, dia 15) e Academia (R$ 99, dia 17)' },
];

export function LandingScreen({ onEnter }: LandingScreenProps) {
  const { T, isDark } = useAppContext();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const accentSoft = isDark ? 'rgba(197,255,77,0.12)' : T.surfaceLo;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={styles.scroll}>
      <View style={[styles.shell, { maxWidth: desktop ? 1080 : 560 }]}>

        {/* Navbar */}
        <View style={styles.nav}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: T.accent }]}>
              <Text style={[styles.brandLetter, { color: T.accentInk }]}>C</Text>
            </View>
            <View>
              <Text style={[styles.brandName, { color: T.text }]}>Contas</Text>
              <Text style={[styles.brandCaption, { color: T.textFaint }]}>FINANÇAS PESSOAIS</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onEnter} activeOpacity={0.8} style={[styles.navButton, { borderColor: T.borderStrong }]}>
            <Text style={[styles.navButtonText, { color: T.text }]}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={[styles.hero, desktop && styles.heroDesktop]}>
          <View style={[styles.heroCopy, desktop && { flex: 1 }]}>
            <View style={[styles.badge, { backgroundColor: accentSoft }]}>
              <Icon name="sparkle" size={13} color={isDark ? T.accent : T.text} stroke={2.2}/>
              <Text style={[styles.badgeText, { color: isDark ? T.accent : T.text }]}>ASSISTENTE FINANCEIRO COM IA</Text>
            </View>
            <Text style={[styles.h1, { color: T.text, fontSize: desktop ? 52 : 38, lineHeight: desktop ? 58 : 44 }]}>
              Suas contas organizadas em uma conversa
            </Text>
            <Text style={[styles.heroSub, { color: T.textDim }]}>
              Esqueça planilhas e formulários. Diga "energia 180 vence dia 15" e pronto:
              conta registrada, categorizada e com lembrete de vencimento.
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity onPress={onEnter} activeOpacity={0.85} style={[styles.ctaPrimary, { backgroundColor: T.accent }]}>
                <Text style={[styles.ctaPrimaryText, { color: T.accentInk }]}>Criar conta grátis</Text>
                <Icon name="arrR" size={16} color={T.accentInk} stroke={2.4}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={onEnter} activeOpacity={0.8} style={[styles.ctaSecondary, { borderColor: T.borderStrong }]}>
                <Text style={[styles.ctaSecondaryText, { color: T.text }]}>Já tenho conta</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroFootnote}>
              <Icon name="lock" size={12} color={T.textFaint} stroke={1.8}/>
              <Text style={[styles.heroFootnoteText, { color: T.textFaint }]}>Grátis. Dados protegidos por usuário.</Text>
            </View>
          </View>

          {/* Chat mockup */}
          <View style={[styles.chatMock, { backgroundColor: T.surface, borderColor: T.border }, desktop && { flex: 1, maxWidth: 440 }]}>
            <View style={[styles.chatMockHeader, { borderBottomColor: T.border }]}>
              <View style={[styles.chatMockPill, { backgroundColor: T.accent }]}>
                <Icon name="sparkle" size={13} color={T.accentInk} stroke={2.4}/>
              </View>
              <Text style={[styles.chatMockTitle, { color: T.text }]}>Assistente</Text>
              <View style={[styles.chatMockDot, { backgroundColor: T.success }]}/>
            </View>
            <View style={styles.chatMockBody}>
              {CHAT_DEMO.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubble,
                    msg.role === 'user'
                      ? { backgroundColor: T.accent, alignSelf: 'flex-end' }
                      : { backgroundColor: T.surfaceHi, alignSelf: 'flex-start' },
                  ]}
                >
                  <Text style={{ color: msg.role === 'user' ? T.accentInk : T.text, fontSize: 13, lineHeight: 19 }}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.chatMockInput, { backgroundColor: T.bg, borderColor: T.borderStrong }]}>
              <Text style={{ color: T.textFaint, fontSize: 13, flex: 1 }}>Digite uma conta ou pergunta…</Text>
              <View style={[styles.chatMockSend, { backgroundColor: T.accent }]}>
                <Icon name="send" size={14} color={T.accentInk} stroke={2.2}/>
              </View>
            </View>
          </View>
        </View>

        {/* Como funciona */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: T.textFaint }]}>COMO FUNCIONA</Text>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Três passos. Zero burocracia.</Text>
          <View style={[styles.cardRow, desktop && styles.cardRowDesktop]}>
            {STEPS.map((step) => (
              <View key={step.step} style={[styles.stepCard, { backgroundColor: T.surface, borderColor: T.border }, desktop && { flex: 1 }]}>
                <View style={styles.stepHead}>
                  <View style={[styles.featureIcon, { backgroundColor: accentSoft }]}>
                    <Icon name={step.icon} size={19} color={isDark ? T.accent : T.text} stroke={2}/>
                  </View>
                  <Text style={[styles.stepNumber, { color: T.textGhost }]}>{step.step}</Text>
                </View>
                <Text style={[styles.cardTitle, { color: T.text }]}>{step.title}</Text>
                <Text style={[styles.cardText, { color: T.textDim }]}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: T.textFaint }]}>RECURSOS</Text>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Tudo que suas finanças precisam</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                style={[
                  styles.featureCard,
                  { backgroundColor: T.surface, borderColor: T.border, width: desktop ? '31.5%' : '100%' },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: accentSoft }]}>
                  <Icon name={feature.icon} size={19} color={isDark ? T.accent : T.text} stroke={2}/>
                </View>
                <Text style={[styles.cardTitle, { color: T.text }]}>{feature.title}</Text>
                <Text style={[styles.cardText, { color: T.textDim }]}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Categorias */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: T.textFaint }]}>CATEGORIAS</Text>
          <Text style={[styles.sectionTitle, { color: T.text }]}>Cada gasto no seu lugar</Text>
          <View style={styles.chipWrap}>
            {Object.values(CATEGORIES).map((cat) => (
              <View key={cat.label} style={[styles.chip, { backgroundColor: cat.bg }]}>
                <Icon name={cat.icon} size={14} color={cat.color} stroke={2}/>
                <Text style={[styles.chipText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Segurança */}
        <View style={[styles.securityCard, { backgroundColor: T.surface, borderColor: T.border }, desktop && styles.securityCardDesktop]}>
          <View style={[styles.securityIcon, { backgroundColor: accentSoft }]}>
            <Icon name="shield" size={24} color={isDark ? T.accent : T.text} stroke={1.8}/>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: T.text, fontSize: 18 }]}>Seus dados, só seus</Text>
            <Text style={[styles.cardText, { color: T.textDim }]}>
              Cada conta é isolada por usuário, com autenticação segura e conexão criptografada.
              Suas informações financeiras nunca são compartilhadas.
            </Text>
          </View>
        </View>

        {/* CTA final */}
        <View style={styles.finalCta}>
          <Text style={[styles.h1, { color: T.text, fontSize: desktop ? 36 : 28, lineHeight: desktop ? 42 : 34, textAlign: 'center' }]}>
            Comece agora. É grátis.
          </Text>
          <Text style={[styles.heroSub, { color: T.textDim, textAlign: 'center', marginTop: 10 }]}>
            Crie sua conta e organize suas finanças conversando.
          </Text>
          <TouchableOpacity onPress={onEnter} activeOpacity={0.85} style={[styles.ctaPrimary, { backgroundColor: T.accent, marginTop: 24, alignSelf: 'center' }]}>
            <Text style={[styles.ctaPrimaryText, { color: T.accentInk }]}>Criar conta grátis</Text>
            <Icon name="arrR" size={16} color={T.accentInk} stroke={2.4}/>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: T.border }]}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: T.accent, width: 30, height: 30, borderRadius: 9 }]}>
              <Text style={[styles.brandLetter, { color: T.accentInk, fontSize: 13 }]}>C</Text>
            </View>
            <Text style={[styles.brandName, { color: T.text, fontSize: 15 }]}>Contas</Text>
          </View>
          <Text style={[styles.footerText, { color: T.textFaint }]}>
            Finanças pessoais com inteligência artificial
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  shell: { width: '100%', alignSelf: 'center' },

  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandLetter: { fontSize: 16, fontWeight: '800' },
  brandName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.5 },
  brandCaption: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginTop: 2 },
  navButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { fontSize: 13, fontWeight: '600' },

  hero: { paddingTop: 36, paddingBottom: 20, gap: 36 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 40, gap: 56 },
  heroCopy: { gap: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  h1: { fontWeight: '800', letterSpacing: -1.4, marginTop: 18 },
  heroSub: { fontSize: 16, lineHeight: 25, marginTop: 16, maxWidth: 480 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 26 },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 52, borderRadius: 15, paddingHorizontal: 24 },
  ctaPrimaryText: { fontSize: 15, fontWeight: '700' },
  ctaSecondary: { borderWidth: 1, minHeight: 52, borderRadius: 15, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  ctaSecondaryText: { fontSize: 15, fontWeight: '600' },
  heroFootnote: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16 },
  heroFootnoteText: { fontSize: 12 },

  chatMock: { borderWidth: 1, borderRadius: 24, padding: 18, width: '100%', alignSelf: 'center' },
  chatMockHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottomWidth: 1 },
  chatMockPill: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chatMockTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  chatMockDot: { width: 7, height: 7, borderRadius: 4 },
  chatMockBody: { paddingVertical: 16, gap: 10 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  chatMockInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 13, paddingLeft: 14, paddingRight: 6, minHeight: 46 },
  chatMockSend: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  section: { paddingTop: 56 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  sectionTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 8, marginBottom: 24 },
  cardRow: { gap: 14 },
  cardRowDesktop: { flexDirection: 'row' },
  stepCard: { borderWidth: 1, borderRadius: 20, padding: 22 },
  stepHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stepNumber: { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  featureCard: { borderWidth: 1, borderRadius: 20, padding: 22 },
  featureIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 16 },
  cardText: { fontSize: 13, lineHeight: 20, marginTop: 7 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '600' },

  securityCard: { flexDirection: 'column', gap: 16, borderWidth: 1, borderRadius: 24, padding: 26, marginTop: 56 },
  securityCardDesktop: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  securityIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  finalCta: { paddingTop: 72, paddingBottom: 56, alignItems: 'center' },
  footer: { borderTopWidth: 1, paddingTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  footerText: { fontSize: 12 },
});
