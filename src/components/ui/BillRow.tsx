import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import type { ThemeTokens } from '../../theme/tokens';
import type { Conta } from '../../types';
import { daysUntil, formatDueShort, formatBRLFull } from '../../utils/billHelpers';

interface Props {
  bill: Conta;
  T: ThemeTokens;
  onPress?: () => void;
  showDate?: boolean;
  dense?: boolean;
}

export function BillRow({ bill, T, onPress, showDate = true, dense = false }: Props) {
  const d = daysUntil(bill.vencimento);
  const overdue = !bill.pago && d < 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: dense ? 10 : 14,
      }}
    >
      <CategoryIcon category={bill.categoria} size={dense ? 36 : 42} rounded={12} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{
          fontSize: 15, fontWeight: '500', color: T.text,
          letterSpacing: -0.15,
        }} numberOfLines={1}>{bill.descricao}</Text>
        {showDate && (
          <Text style={{ fontSize: 12, color: overdue ? T.danger : T.textDim, marginTop: 2, letterSpacing: -0.05 }}>
            {bill.pago
              ? '✓ Paga'
              : formatDueShort(bill.vencimento)}
            {!!bill.recorrente && !bill.pago && (
              <Text style={{ color: T.textFaint }}> · mensal</Text>
            )}
          </Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          fontSize: 15, fontWeight: '600',
          color: bill.pago ? T.textDim : T.text,
          letterSpacing: -0.3,
          textDecorationLine: bill.pago ? 'line-through' : 'none',
        }}>
          {formatBRLFull(bill.valor)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
