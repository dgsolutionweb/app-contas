import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { useAppContext } from '../context/AppContext';

function ArtBalance({ T }: { T: any }) {
  return (
    <View style={{ width: 260, aspectRatio: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', top: '18%', left: '8%', right: '8%', bottom: '18%',
        borderRadius: 24, backgroundColor: T.surface,
        borderWidth: 1, borderColor: T.border,
        padding: 18, justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 10, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>Abril</Text>
        <Text style={{ fontSize: 28, fontWeight: '600', color: T.text, letterSpacing: -0.8 }}>R$ 2.847</Text>
        <View>
          <View style={{ height: 4, backgroundColor: T.borderStrong, borderRadius: 100, overflow: 'hidden' }}>
            <View style={{ width: '38%', height: '100%', backgroundColor: T.accent, borderRadius: 100 }}/>
          </View>
          <Text style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>5 de 15 pagas</Text>
        </View>
      </View>
      <View style={{
        position: 'absolute', bottom: '5%', right: '-4%',
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100,
        backgroundColor: T.accent, flexDirection: 'row', alignItems: 'center', gap: 6,
      }}>
        <Icon name="check" size={14} color={T.accentInk} stroke={2.5}/>
        <Text style={{ color: T.accentInk, fontSize: 12, fontWeight: '600' }}>Paga!</Text>
      </View>
    </View>
  );
}

function ArtChat({ T }: { T: any }) {
  return (
    <View style={{ width: 280, gap: 10 }}>
      <View style={{ alignSelf: 'flex-end', maxWidth: '75%',
        backgroundColor: T.accent, borderRadius: 18, borderBottomRightRadius: 6,
        paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ color: T.accentInk, fontSize: 14, fontWeight: '500', letterSpacing: -0.15 }}>paguei o aluguel</Text>
      </View>
      <View style={{ alignSelf: 'flex-start', maxWidth: '85%',
        backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
        borderRadius: 18, borderBottomLeftRadius: 6,
        paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ color: T.text, fontSize: 14, letterSpacing: -0.15 }}>✓ Marquei como paga.{'\n'}Menos uma!</Text>
      </View>
      <View style={{ alignSelf: 'flex-end', maxWidth: '75%',
        backgroundColor: T.accent, borderRadius: 18, borderBottomRightRadius: 6,
        paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ color: T.accentInk, fontSize: 14, fontWeight: '500', letterSpacing: -0.15 }}>quanto falta?</Text>
      </View>
    </View>
  );
}

function ArtCategories({ T }: { T: any }) {
  const cats = ['moradia', 'alimentacao', 'transporte', 'assinatura', 'saude', 'lazer'];
  return (
    <View style={{ width: 260, flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 10 }}>
      {cats.map((c, i) => (
        <View key={c} style={{
          width: 72, height: 72, borderRadius: 18,
          backgroundColor: T.surface,
          borderWidth: 1, borderColor: T.border,
          alignItems: 'center', justifyContent: 'center',
          transform: [{ rotate: `${(i % 2 ? 1 : -1) * 3}deg` }],
        }}>
          <CategoryIcon category={c} size={44} rounded={14} />
        </View>
      ))}
    </View>
  );
}

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const { T } = useAppContext();
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: 'Suas contas,\ncom clareza.',
      body: 'Tudo que vence no mês, quanto já foi pago e o que ainda falta. Sem planilhas.',
      art: <ArtBalance T={T} />,
    },
    {
      title: 'Fala comigo\nnaturalmente.',
      body: 'Diga "paguei o aluguel" ou "adicionar internet 130 dia 28". A IA cuida do resto.',
      art: <ArtChat T={T} />,
    },
    {
      title: 'Categorias\nautomáticas.',
      body: 'Cada conta entra na categoria certa. Você vê onde o dinheiro vai.',
      art: <ArtCategories T={T} />,
    },
  ];

  const slide = slides[step];
  const last = step === slides.length - 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {slides.map((_, i) => (
            <View key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              backgroundColor: i === step ? T.text : T.borderStrong,
            }}/>
          ))}
        </View>
        <TouchableOpacity onPress={onDone} activeOpacity={0.7}>
          <Text style={{ color: T.textDim, fontSize: 13, fontWeight: '500', letterSpacing: -0.1 }}>Pular</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        {slide.art}
      </View>

      <View style={{ paddingHorizontal: 28, paddingBottom: 32 }}>
        <Text style={{ fontSize: 32, fontWeight: '600', color: T.text, letterSpacing: -1.2, lineHeight: 36, marginBottom: 12 }}>
          {slide.title}
        </Text>
        <Text style={{ fontSize: 15, color: T.textDim, lineHeight: 22, letterSpacing: -0.15 }}>
          {slide.body}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={() => last ? onDone() : setStep(step + 1)}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: T.accent, borderRadius: 100, paddingVertical: 16,
          }}
        >
          <Text style={{ color: T.accentInk, fontSize: 15, fontWeight: '600', letterSpacing: -0.15 }}>
            {last ? 'Começar' : 'Próximo'}
          </Text>
          <Icon name="arrR" size={16} color={T.accentInk} stroke={2.5}/>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
