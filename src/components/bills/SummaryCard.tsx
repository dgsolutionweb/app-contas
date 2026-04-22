import React from 'react';
import { View, Text } from 'react-native';
import type { SummaryPayload } from '../../types';
import { formatCurrency } from '../../utils/formatter';
import { useAppContext } from '../../context/AppContext';
import { CATEGORIES } from '../../theme/tokens';

interface Props {
  payload: SummaryPayload;
  compact?: boolean;
}

export function SummaryCard({ payload, compact }: Props) {
  const { T } = useAppContext();
  const paidPct = payload.total > 0 ? Math.min((payload.totalPago / payload.total) * 100, 100) : 0;

  if (compact) {
    return (
      <View style={{
        backgroundColor: T.surfaceHi,
        borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: T.border,
      }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10, gap: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1 }}>
            {payload.mes}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.7 }}>
            {formatCurrency(payload.total)}
          </Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <View style={{
            flex: 1, backgroundColor: T.surface, borderRadius: 12,
            paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '500', color: T.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pago
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: T.success, letterSpacing: -0.3 }}>
              {formatCurrency(payload.totalPago)}
            </Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: T.surface, borderRadius: 12,
            paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 10, fontWeight: '500', color: T.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pendente
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: payload.totalPendente > 0 ? T.warn : T.textDim, letterSpacing: -0.3 }}>
              {formatCurrency(payload.totalPendente)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, borderRadius: 2, backgroundColor: T.border, overflow: 'hidden', marginBottom: 5 }}>
          <View style={{ height: 4, borderRadius: 2, width: `${paidPct}%` as any, backgroundColor: T.success }}/>
        </View>
        <Text style={{ fontSize: 11, color: T.textFaint, textAlign: 'right', fontWeight: '500' }}>
          {payload.countPago}/{payload.count} · {Math.round(paidPct)}%
        </Text>
      </View>
    );
  }

  // Full card (SummaryScreen)
  return (
    <View style={{
      backgroundColor: T.surface, borderRadius: 20,
      padding: 20, borderWidth: 1, borderColor: T.border,
    }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {payload.mes}
      </Text>
      <Text style={{ fontSize: 32, fontWeight: '700', color: T.text, letterSpacing: -1, marginBottom: 20 }}>
        {formatCurrency(payload.total)}
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: T.surfaceHi, borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: T.textFaint, marginBottom: 6, fontWeight: '500' }}>Pago</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: T.success, letterSpacing: -0.4 }}>
            {formatCurrency(payload.totalPago)}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: T.surfaceHi, borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: T.textFaint, marginBottom: 6, fontWeight: '500' }}>Pendente</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: payload.totalPendente > 0 ? T.warn : T.textDim, letterSpacing: -0.4 }}>
            {formatCurrency(payload.totalPendente)}
          </Text>
        </View>
      </View>

      <View style={{ height: 6, borderRadius: 3, backgroundColor: T.border, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ height: 6, borderRadius: 3, width: `${paidPct}%` as any, backgroundColor: T.success }}/>
      </View>
      <Text style={{ fontSize: 12, color: T.textFaint, textAlign: 'right', fontWeight: '500', marginBottom: 20 }}>
        {payload.countPago} de {payload.count} contas · {Math.round(paidPct)}%
      </Text>

      {payload.porCategoria.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: T.border, paddingTop: 16, gap: 10 }}>
          {payload.porCategoria.map((cat) => {
            const info = CATEGORIES[cat.categoria] ?? CATEGORIES.outros;
            return (
              <View key={cat.categoria} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: info.color }}/>
                  <Text style={{ fontSize: 14, color: T.text, fontWeight: '500' }}>{info.label}</Text>
                </View>
                <Text style={{ fontSize: 14, color: T.textDim, fontWeight: '600' }}>
                  {formatCurrency(cat.total)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
