import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Animated, Easing } from 'react-native';
import type { ChatMessage, BillListPayload, SummaryPayload, ConfirmPayload, Conta } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { BillCard } from '../bills/BillCard';
import { SummaryCard } from '../bills/SummaryCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  message: ChatMessage;
  onMarkPaid?: (conta: Conta) => void;
  onConfirm?: (payload: ConfirmPayload) => void;
  onCancel?: () => void;
}

function renderContent(text: string, textColor: string, dimColor: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <Text key={i} style={{ fontWeight: '700', color: textColor }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return (
      <Text key={i} style={{ color: textColor }}>
        {part}
      </Text>
    );
  });
}

function formatTime(isoString: string): string {
  try {
    return format(new Date(isoString), 'HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
}

export function MessageBubble({ message, onMarkPaid, onConfirm, onCancel }: Props) {
  const { T } = useAppContext();
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(8)).current;
  const isUser = message.role === 'user';
  const hasExtra = message.tipo === 'bill_list' || message.tipo === 'summary';
  const hasRichCard = !isUser && hasExtra;
  const maxW = Math.min(width * 0.82, 420);
  const richW = Math.min(width * 0.8, 392);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateAnim, { toValue: 0, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const bubbleBg = isUser ? T.accent : T.surface;
  const bubbleBorder = isUser ? 'transparent' : T.border;
  const textColor = isUser ? T.accentInk : T.text;
  const timeColor = isUser ? 'rgba(10,10,11,0.45)' : T.textFaint;
  const hasText = Boolean(message.content?.trim());

  return (
    <Animated.View
      style={[
        { marginVertical: 3, marginHorizontal: 14 },
        isUser ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
        { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
      ]}
    >
      {hasRichCard ? (
        <View style={{ width: richW }}>
          {hasText && (
            <View
              style={{
                alignSelf: 'flex-start',
                maxWidth: richW,
                borderRadius: 18,
                borderBottomLeftRadius: 8,
                borderWidth: 1,
                borderColor: T.border,
                backgroundColor: T.surface,
                paddingHorizontal: 14,
                paddingVertical: 11,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 20, letterSpacing: -0.1, color: T.text }}>
                {renderContent(message.content, T.text, T.textDim)}
              </Text>
            </View>
          )}

          {message.tipo === 'bill_list' && message.payload && (
            <View style={{ gap: 6 }}>
              {(message.payload as BillListPayload).contas.map((conta) => (
                <BillCard key={conta.id} conta={conta} onMarkPaid={onMarkPaid} compact />
              ))}
            </View>
          )}

          {message.tipo === 'summary' && message.payload && (
            <SummaryCard payload={message.payload as SummaryPayload} compact />
          )}

          <Text style={{ fontSize: 10, fontWeight: '500', color: timeColor, marginTop: 6, textAlign: 'right', paddingRight: 2 }}>
            {formatTime(message.criado_em)}
          </Text>
        </View>
      ) : (
        <View
          style={[
            {
              maxWidth: maxW,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: bubbleBorder,
              backgroundColor: bubbleBg,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 10,
            },
            isUser
              ? { borderBottomRightRadius: 5 }
              : { borderBottomLeftRadius: 5 },
          ]}
        >
          <Text style={{ fontSize: 14, lineHeight: 21, letterSpacing: -0.1 }}>
            {renderContent(message.content, textColor, isUser ? 'rgba(10,10,11,0.7)' : T.textDim)}
          </Text>

          {message.tipo === 'confirm' && message.payload && (
            <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: T.danger, alignItems: 'center',
                }}
                onPress={() => onConfirm?.(message.payload as ConfirmPayload)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: -0.1 }}>
                  Confirmar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12,
                  borderWidth: 1, borderColor: T.border, alignItems: 'center',
                }}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={{ color: T.textDim, fontSize: 13, fontWeight: '600', letterSpacing: -0.1 }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={{ fontSize: 10, fontWeight: '500', color: timeColor, marginTop: 6, textAlign: 'right' }}>
            {formatTime(message.criado_em)}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
