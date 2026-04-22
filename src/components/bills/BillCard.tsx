import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Conta } from '../../types';
import { formatCurrency } from '../../utils/formatter';
import { formatDisplayDate } from '../../utils/dateHelpers';
import { useAppContext } from '../../context/AppContext';
import { CATEGORIES } from '../../theme/tokens';
import { Icon } from '../ui/Icon';

interface Props {
  conta: Conta;
  onMarkPaid?: (conta: Conta) => void;
  compact?: boolean;
}

function isOverdue(vencimento: string): boolean {
  return vencimento < new Date().toISOString().slice(0, 10);
}

export function BillCard({ conta, onMarkPaid, compact }: Props) {
  const { T } = useAppContext();
  const cat = CATEGORIES[conta.categoria] ?? CATEGORIES.outros;
  const overdue = conta.pago === 0 && isOverdue(conta.vencimento);

  if (compact) {
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: T.surfaceHi,
        borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11,
        gap: 10,
      }}>
        {/* Category icon */}
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: cat.bg,
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={cat.icon} size={16} color={cat.color} stroke={1.8}/>
        </View>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: T.text, letterSpacing: -0.2 }} numberOfLines={1}>
            {conta.descricao}
          </Text>
          <Text style={{ fontSize: 11, color: overdue ? T.warn : T.textFaint, marginTop: 1 }} numberOfLines={1}>
            {formatDisplayDate(conta.vencimento)}{overdue ? ' · Vencida' : ''}
          </Text>
        </View>

        {/* Amount + action */}
        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Text style={{
            fontSize: 14, fontWeight: '700', letterSpacing: -0.4,
            color: overdue ? T.warn : T.text,
          }} numberOfLines={1}>
            {formatCurrency(conta.valor)}
          </Text>
          {conta.pago === 0 && onMarkPaid ? (
            <TouchableOpacity
              onPress={() => onMarkPaid(conta)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                marginTop: 4, paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 8, backgroundColor: T.accent,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: T.accentInk, letterSpacing: -0.1 }}>
                Pagar
              </Text>
            </TouchableOpacity>
          ) : conta.pago === 1 ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: T.success, marginTop: 4 }}>Paga ✓</Text>
          ) : null}
        </View>
      </View>
    );
  }

  // Full card (used in BillsScreen)
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: T.surface,
      borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: overdue ? T.warn + '30' : T.border,
      gap: 12,
    }}>
      <View style={{
        width: 44, height: 44, borderRadius: 13,
        backgroundColor: cat.bg,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={cat.icon} size={19} color={cat.color} stroke={1.8}/>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: T.text, letterSpacing: -0.25 }} numberOfLines={1}>
          {conta.descricao}
        </Text>
        <Text style={{ fontSize: 12, color: overdue ? T.warn : T.textDim, marginTop: 3 }} numberOfLines={1}>
          {cat.label} · {formatDisplayDate(conta.vencimento)}{overdue ? ' · Vencida' : ''}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', letterSpacing: -0.4, color: overdue ? T.warn : T.text }}>
          {formatCurrency(conta.valor)}
        </Text>
        {conta.pago === 0 && onMarkPaid ? (
          <TouchableOpacity
            onPress={() => onMarkPaid(conta)}
            activeOpacity={0.75}
            style={{
              marginTop: 6, paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 10, backgroundColor: T.accent,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: T.accentInk }}>Pagar</Text>
          </TouchableOpacity>
        ) : conta.pago === 1 ? (
          <View style={{
            marginTop: 6, paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 8, backgroundColor: T.success + '1A',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: T.success }}>Paga ✓</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
