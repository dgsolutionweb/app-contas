import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Icon } from '../components/ui/Icon';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES, ThemeTokens } from '../theme/tokens';

interface LandingScreenProps {
  onEnter: () => void;
}

/* ---------------------------------------------------------------- */
/* Credit card artwork                                               */
/* ---------------------------------------------------------------- */

function CreditCardArt({ T }: { T: ThemeTokens }) {
  return (
    <View style={styles.cardStage}>
      {/* Back card — lime */}
      <View style={[styles.cardBack]}>
        <Svg width="100%" height="100%" viewBox="0 0 340 210">
          <Defs>
            <LinearGradient id="limeGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#D4FF70"/>
              <Stop offset="1" stopColor="#A8E62E"/>
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="340" height="210" rx="22" fill="url(#limeGrad)"/>
          <Circle cx="290" cy="40" r="90" fill="rgba(10,10,11,0.07)"/>
          <Circle cx="50" cy="190" r="70" fill="rgba(255,255,255,0.18)"/>
        </Svg>
      </View>

      {/* Front card — dark */}
      <View style={styles.cardFront}>
        <Svg width="100%" height="100%" viewBox="0 0 340 210" style={StyleSheet.absoluteFill as any}>
          <Defs>
            <LinearGradient id="darkGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#232328"/>
              <Stop offset="0.55" stopColor="#141416"/>
              <Stop offset="1" stopColor="#0A0A0B"/>
            </LinearGradient>
            <LinearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E8FFA3"/>
              <Stop offset="1" stopColor="#C5FF4D"/>
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="340" height="210" rx="22" fill="url(#darkGrad)"/>
          <Rect x="0.5" y="0.5" width="339" height="209" rx="21.5" fill="none" stroke="rgba(255,255,255,0.10)"/>
          {/* Glow accent */}
          <Circle cx="320" cy="-10" r="110" fill="rgba(197,255,77,0.10)"/>
          {/* Chip */}
          <Rect x="28" y="78" width="42" height="32" rx="7" fill="url(#chipGrad)"/>
          <Path d="M28 90 h42 M28 98 h42 M42 78 v32 M56 78 v32" stroke="rgba(10,10,11,0.35)" strokeWidth="1.4"/>
          {/* Contactless */}
          <Path d="M88 86 a14 14 0 0 1 0 16 M94 82 a20 20 0 0 1 0 24 M100 78 a26 26 0 0 1 0 32"
            stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </Svg>

        <View style={styles.cardFrontContent} pointerEvents="none">
          <View style={styles.cardTopRow}>
            <View style={styles.cardBrandRow}>
              <View style={styles.cardBrandMark}>
                <Text style={styles.cardBrandLetter}>C</Text>
              </View>
              <Text style={styles.cardBrandName}>Contas</Text>
            </View>
            <Text style={styles.cardKind}>VIRTUAL</Text>
          </View>

          <View style={{ flex: 1 }}/>

          <Text style={styles.cardNumber}>••••  ••••  ••••  4929</Text>
          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardFieldLabel}>TITULAR</Text>
              <Text style={styles.cardFieldValue}>SUAS FINANÇAS</Text>
            </View>
            <View>
              <Text style={styles.cardFieldLabel}>CONTROLE</Text>
              <Text style={styles.cardFieldValue}>24/7</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Floating chips */}
      <View style={[styles.floatChip, styles.floatChipPaid, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={[styles.floatChipIcon, { backgroundColor: 'rgba(77,232,143,0.16)' }]}>
          <Icon name="check" size={13} color={T.success} stroke={2.6}/>
        </View>
        <View>
          <Text style={[styles.floatChipTitle, { color: T.text }]}>Internet paga</Text>
          <Text style={[styles.floatChipSub, { color: T.textFaint }]}>R$ 120,00 · hoje</Text>
        </View>
      </View>

      <View style={[styles.floatChip, styles.floatChipDue, { backgroundColor: T.surface, borderColor: T.border }]}>
        <View style={[styles.floatChipIcon, { backgroundColor: 'rgba(255,184,77,0.16)' }]}>
          <Icon name="bell" size={13} color={T.warn} stroke={2.2}/>
        </View>
        <View>
          <Text style={[styles.floatChipTitle, { color: T.text }]}>Energia vence dia 15</Text>
          <Text style={[styles.floatChipSub, { color: T.textFaint }]}>R$ 180,00 · lembrete ativo</Text>
        </View>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- */
/* Animated chat demo                                                */
/* ---------------------------------------------------------------- */

const CHAT_SCRIPT = [
  { role: 'user' as const, text: 'paguei a internet, 120 reais' },
  { role: 'bot' as const, text: 'Conta registrada e marcada como paga ✓\nCategoria: Moradia' },
  { role: 'user' as const, text: 'o que vence essa semana?' },
  { role: 'bot' as const, text: '2 contas:\n⚡ Energia — R$ 180 (dia 15)\n💪 Academia — R$ 99 (dia 17)' },
];

function ChatMessage({ msg, T }: { msg: typeof CHAT_SCRIPT[number]; T: ThemeTokens }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [fade]);

  const isUser = msg.role === 'user';
  return (
    <Animated.View
      style={[
        styles.bubble,
        isUser
          ? { backgroundColor: T.accent, alignSelf: 'flex-end' }
          : { backgroundColor: T.surfaceHi, alignSelf: 'flex-start' },
        { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      <Text style={{ color: isUser ? T.accentInk : T.text, fontSize: 13, lineHeight: 19 }}>{msg.text}</Text>
    </Animated.View>
  );
}

function TypingDots({ T }: { T: ThemeTokens }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.bubble, styles.typingBubble, { backgroundColor: T.surfaceHi }]}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            { backgroundColor: T.textFaint, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: i % 2 ? [0.9, 0.3] : [0.3, 0.9] }) },
          ]}
        />
      ))}
    </View>
  );
}

function AnimatedChatDemo({ T }: { T: ThemeTokens }) {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(id);
    };

    const run = () => {
      setVisible(0);
      setTyping(false);
      let at = 600;
      CHAT_SCRIPT.forEach((msg, i) => {
        if (msg.role === 'bot') {
          schedule(() => setTyping(true), at);
          at += 950;
        }
        schedule(() => { setTyping(false); setVisible(i + 1); }, at);
        at += 1150;
      });
      schedule(run, at + 2400);
    };

    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  return (
    <View style={[styles.chatMock, { backgroundColor: T.surface, borderColor: T.border }]}>
      <View style={[styles.chatMockHeader, { borderBottomColor: T.border }]}>
        <View style={[styles.chatMockPill, { backgroundColor: T.accent }]}>
          <Icon name="sparkle" size={13} color={T.accentInk} stroke={2.4}/>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chatMockTitle, { color: T.text }]}>Assistente</Text>
          <Text style={{ color: T.textFaint, fontSize: 10, marginTop: 1 }}>responde na hora</Text>
        </View>
        <View style={[styles.chatMockDot, { backgroundColor: T.success }]}/>
      </View>
      <View style={styles.chatMockBody}>
        {CHAT_SCRIPT.slice(0, visible).map((msg, i) => <ChatMessage key={i} msg={msg} T={T}/>)}
        {typing && <TypingDots T={T}/>}
      </View>
      <View style={[styles.chatMockInput, { backgroundColor: T.bg, borderColor: T.borderStrong }]}>
        <Icon name="mic" size={15} color={T.textFaint} stroke={1.8}/>
        <Text style={{ color: T.textFaint, fontSize: 13, flex: 1 }}>Digite uma conta ou pergunta…</Text>
        <View style={[styles.chatMockSend, { backgroundColor: T.accent }]}>
          <Icon name="send" size={14} color={T.accentInk} stroke={2.2}/>
        </View>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- */
/* Dashboard mock (gastos por categoria)                             */
/* ---------------------------------------------------------------- */

const SPEND_DEMO = [
  { key: 'moradia', value: 'R$ 1.240', pct: 0.78 },
  { key: 'alimentacao', value: 'R$ 860', pct: 0.54 },
  { key: 'transporte', value: 'R$ 420', pct: 0.30 },
  { key: 'assinatura', value: 'R$ 187', pct: 0.16 },
];

function DashboardMock({ T }: { T: ThemeTokens }) {
  return (
    <View style={[styles.dashCard, { backgroundColor: T.surface, borderColor: T.border }]}>
      <View style={styles.dashHeader}>
        <View>
          <Text style={{ color: T.textFaint, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 }}>JUNHO</Text>
          <Text style={{ color: T.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 }}>R$ 2.707,00</Text>
          <Text style={{ color: T.textDim, fontSize: 12, marginTop: 2 }}>total do mês · 11 contas</Text>
        </View>
        <View style={[styles.dashBadge, { backgroundColor: 'rgba(77,232,143,0.14)' }]}>
          <Icon name="trend" size={13} color={T.success} stroke={2.2}/>
          <Text style={{ color: T.success, fontSize: 11, fontWeight: '700' }}>8 pagas</Text>
        </View>
      </View>

      <View style={{ gap: 14, marginTop: 22 }}>
        {SPEND_DEMO.map(({ key, value, pct }) => {
          const cat = CATEGORIES[key];
          return (
            <View key={key}>
              <View style={styles.dashRowTop}>
                <View style={styles.dashRowLabel}>
                  <View style={[styles.dashRowIcon, { backgroundColor: cat.bg }]}>
                    <Icon name={cat.icon} size={12} color={cat.color} stroke={2}/>
                  </View>
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{cat.label}</Text>
                </View>
                <Text style={{ color: T.textDim, fontSize: 13, fontWeight: '600' }}>{value}</Text>
              </View>
              <View style={[styles.dashTrack, { backgroundColor: T.surfaceLo }]}>
                <View style={[styles.dashFill, { backgroundColor: cat.color, width: `${pct * 100}%` }]}/>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- */
/* Landing                                                           */
/* ---------------------------------------------------------------- */

const STATS = [
  { value: 'IA', label: 'entende linguagem natural' },
  { value: '9', label: 'categorias automáticas' },
  { value: '2', label: 'plataformas: Android e web' },
  { value: '0', label: 'planilhas necessárias' },
];

const FEATURES = [
  { icon: 'sparkle', title: 'Chat com IA', text: 'Registre, consulte e pague contas conversando em linguagem natural, por texto ou voz.' },
  { icon: 'tag', title: 'Categorias automáticas', text: 'Moradia, alimentação, transporte e mais — cada conta classificada sem esforço.' },
  { icon: 'bell', title: 'Vencimentos em dia', text: 'Painel mostra o que vence hoje, essa semana e o que está atrasado, sem surpresas.' },
  { icon: 'repeat', title: 'Contas recorrentes', text: 'Assinaturas e contas fixas se repetem sozinhas todo mês. Cadastre uma vez só.' },
  { icon: 'pie', title: 'Resumos e insights', text: 'Total do mês, gastos por categoria e dicas sobre seu padrão de gastos.' },
  { icon: 'globe', title: 'Android e web', text: 'Seus dados sincronizados entre o celular e o navegador, sempre atualizados.' },
];

export function LandingScreen({ onEnter }: LandingScreenProps) {
  const { T, isDark } = useAppContext();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const accentSoft = isDark ? 'rgba(197,255,77,0.12)' : T.surfaceLo;
  const accentText = isDark ? T.accent : T.text;

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
          <View style={[styles.heroCopy, desktop && { flex: 1.05 }]}>
            <View style={[styles.badge, { backgroundColor: accentSoft }]}>
              <Icon name="sparkle" size={13} color={accentText} stroke={2.2}/>
              <Text style={[styles.badgeText, { color: accentText }]}>SEU BANCO DE CONTAS COM IA</Text>
            </View>
            <Text style={[styles.h1, { color: T.text, fontSize: desktop ? 54 : 38, lineHeight: desktop ? 60 : 44 }]}>
              O controle das suas contas, nível banco digital
            </Text>
            <Text style={[styles.heroSub, { color: T.textDim }]}>
              Registre gastos conversando, acompanhe vencimentos em tempo real e veja
              para onde seu dinheiro vai — sem planilha, sem fricção.
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity onPress={onEnter} activeOpacity={0.85} style={[styles.ctaPrimary, { backgroundColor: T.accent }]}>
                <Text style={[styles.ctaPrimaryText, { color: T.accentInk }]}>Abrir minha conta</Text>
                <Icon name="arrR" size={16} color={T.accentInk} stroke={2.4}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={onEnter} activeOpacity={0.8} style={[styles.ctaSecondary, { borderColor: T.borderStrong }]}>
                <Text style={[styles.ctaSecondaryText, { color: T.text }]}>Já tenho conta</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroFootnote}>
              <Icon name="lock" size={12} color={T.textFaint} stroke={1.8}/>
              <Text style={[styles.heroFootnoteText, { color: T.textFaint }]}>Grátis. Dados isolados e protegidos por usuário.</Text>
            </View>
          </View>

          <View style={[desktop ? { flex: 1 } : null, { alignItems: 'center' }]}>
            <CreditCardArt T={T}/>
          </View>
        </View>

        {/* Stats band */}
        <View style={[styles.statsBand, { borderColor: T.border, backgroundColor: T.bgElevated }]}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statItem, { minWidth: desktop ? 0 : '44%' }]}>
              <Text style={[styles.statValue, { color: accentText }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: T.textDim }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Chat + copy */}
        <View style={[styles.split, desktop && styles.splitDesktop]}>
          <View style={[desktop && { flex: 1 }]}>
            <Text style={[styles.sectionLabel, { color: T.textFaint }]}>CONVERSE COM SEU DINHEIRO</Text>
            <Text style={[styles.sectionTitle, { color: T.text }]}>Falar é o novo digitar</Text>
            <Text style={[styles.sectionText, { color: T.textDim }]}>
              Nada de formulário com dez campos. Mande "luz 180 vence dia 15" e o
              assistente entende valor, vencimento e categoria sozinho. Pergunte
              "quanto gastei esse mês?" e receba a resposta na hora.
            </Text>
            <View style={styles.checkList}>
              {['Texto ou voz, como preferir', 'Registra, paga e consulta contas', 'Respostas com seus dados reais'].map((item) => (
                <View key={item} style={styles.checkRow}>
                  <View style={[styles.checkIcon, { backgroundColor: accentSoft }]}>
                    <Icon name="check" size={12} color={accentText} stroke={2.6}/>
                  </View>
                  <Text style={{ color: T.textDim, fontSize: 14 }}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[desktop && { flex: 1, maxWidth: 440 }, { width: '100%' }]}>
            <AnimatedChatDemo T={T}/>
          </View>
        </View>

        {/* Dashboard + copy */}
        <View style={[styles.split, desktop && styles.splitDesktopReverse]}>
          <View style={[desktop && { flex: 1, maxWidth: 460 }, { width: '100%' }]}>
            <DashboardMock T={T}/>
          </View>
          <View style={[desktop && { flex: 1 }]}>
            <Text style={[styles.sectionLabel, { color: T.textFaint }]}>VISÃO DE BANCO DIGITAL</Text>
            <Text style={[styles.sectionTitle, { color: T.text }]}>Seu mês inteiro em um painel</Text>
            <Text style={[styles.sectionText, { color: T.textDim }]}>
              Total do mês, contas pagas, o que ainda vence e gastos por categoria —
              tudo atualizado em tempo real, no celular e no navegador.
            </Text>
            <View style={styles.checkList}>
              {['Gastos por categoria com cores', 'Resumo mensal automático', 'Insights sobre seu padrão de gastos'].map((item) => (
                <View key={item} style={styles.checkRow}>
                  <View style={[styles.checkIcon, { backgroundColor: accentSoft }]}>
                    <Icon name="check" size={12} color={accentText} stroke={2.6}/>
                  </View>
                  <Text style={{ color: T.textDim, fontSize: 14 }}>{item}</Text>
                </View>
              ))}
            </View>
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
                  <Icon name={feature.icon} size={19} color={accentText} stroke={2}/>
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
            <Icon name="shield" size={24} color={accentText} stroke={1.8}/>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: T.text, fontSize: 18 }]}>Segurança de banco, simplicidade de chat</Text>
            <Text style={[styles.cardText, { color: T.textDim }]}>
              Autenticação segura, conexão criptografada e dados isolados por usuário.
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
            <Text style={[styles.ctaPrimaryText, { color: T.accentInk }]}>Abrir minha conta</Text>
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

  hero: { paddingTop: 36, paddingBottom: 24, gap: 48 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 48, gap: 56 },
  heroCopy: {},
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

  /* Card art */
  cardStage: { width: '100%', maxWidth: 420, aspectRatio: 420 / 330, alignSelf: 'center' },
  cardBack: {
    position: 'absolute', top: 24, left: '11%', width: '78%', aspectRatio: 340 / 210,
    transform: [{ rotate: '7deg' }], opacity: 0.95,
  },
  cardFront: {
    position: 'absolute', top: 58, left: '6%', width: '82%', aspectRatio: 340 / 210,
    transform: [{ rotate: '-4deg' }],
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 28, shadowOffset: { width: 0, height: 16 },
  },
  cardFrontContent: { ...StyleSheet.absoluteFillObject, padding: 20 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBrandMark: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#C5FF4D', alignItems: 'center', justifyContent: 'center' },
  cardBrandLetter: { color: '#0A0A0B', fontSize: 12, fontWeight: '800' },
  cardBrandName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  cardKind: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1.6 },
  cardNumber: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', letterSpacing: 2 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  cardFieldLabel: { color: 'rgba(255,255,255,0.40)', fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  cardFieldValue: { color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginTop: 3 },

  floatChip: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
  },
  floatChipPaid: { top: 0, right: 0 },
  floatChipDue: { bottom: 0, left: 0 },
  floatChipIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  floatChipTitle: { fontSize: 12, fontWeight: '700' },
  floatChipSub: { fontSize: 10, marginTop: 1 },

  /* Stats */
  statsBand: {
    flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 24,
    paddingVertical: 26, paddingHorizontal: 18, marginTop: 16, gap: 18, justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  statValue: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: 12, textAlign: 'center', maxWidth: 150 },

  /* Split sections */
  split: { paddingTop: 72, gap: 36 },
  splitDesktop: { flexDirection: 'row', alignItems: 'center', gap: 64 },
  splitDesktopReverse: { flexDirection: 'row-reverse', alignItems: 'center', gap: 64 },
  sectionText: { fontSize: 15, lineHeight: 24, marginTop: 4, maxWidth: 440 },
  checkList: { gap: 12, marginTop: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  /* Chat mock */
  chatMock: { borderWidth: 1, borderRadius: 24, padding: 18, width: '100%' },
  chatMockHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottomWidth: 1 },
  chatMockPill: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chatMockTitle: { fontSize: 14, fontWeight: '600' },
  chatMockDot: { width: 7, height: 7, borderRadius: 4 },
  chatMockBody: { paddingVertical: 16, gap: 10, minHeight: 252, justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  typingBubble: { flexDirection: 'row', gap: 5, alignSelf: 'flex-start', paddingVertical: 13 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  chatMockInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 13, paddingLeft: 14, paddingRight: 6, minHeight: 46 },
  chatMockSend: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  /* Dashboard mock */
  dashCard: { borderWidth: 1, borderRadius: 24, padding: 24, width: '100%' },
  dashHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  dashBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dashRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  dashRowLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dashRowIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dashTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  dashFill: { height: '100%', borderRadius: 4 },

  /* Sections */
  section: { paddingTop: 72 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  sectionTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 8, marginBottom: 16 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  featureCard: { borderWidth: 1, borderRadius: 20, padding: 22 },
  featureIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 16 },
  cardText: { fontSize: 13, lineHeight: 20, marginTop: 7 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontWeight: '600' },

  securityCard: { flexDirection: 'column', gap: 16, borderWidth: 1, borderRadius: 24, padding: 26, marginTop: 72 },
  securityCardDesktop: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  securityIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  finalCta: { paddingTop: 80, paddingBottom: 56, alignItems: 'center' },
  footer: { borderTopWidth: 1, paddingTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  footerText: { fontSize: 12 },
});
