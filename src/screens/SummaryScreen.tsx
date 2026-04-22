import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { useDatabase } from '../hooks/useDatabase';
import { getAllContas } from '../database/contasRepository';
import { AppHeader } from '../components/ui/AppHeader';
import { Card } from '../components/ui/Card';
import { CATEGORIES } from '../theme/tokens';
import { computeSummary, formatBRL } from '../utils/billHelpers';
import { Icon } from '../components/ui/Icon';
import type { Conta } from '../types';

function StatCard({ T, label, value, sub }: { T: any; label: string; value: string; sub: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 16 }}>
      <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '600', color: T.text, letterSpacing: -0.4, marginTop: 6 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: T.textDim, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

function CategoryBreakdown({ bills, T }: { bills: Conta[]; T: any }) {
  const sum = computeSummary(bills);
  const entries = Object.entries(sum.byCat)
    .map(([k, v]) => ({ cat: k, ...v, info: CATEGORIES[k] || CATEGORIES.outros }))
    .sort((a, b) => b.total - a.total);
  const total = sum.totalMonth;
  if (total === 0) return null;

  return (
    <View>
      <View style={{ height: 10, borderRadius: 100, overflow: 'hidden', flexDirection: 'row', gap: 2, marginBottom: 16 }}>
        {entries.map(e => (
          <View key={e.cat} style={{ flex: e.total / total, backgroundColor: e.info.color, minWidth: 2 }}/>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        {entries.map(e => (
          <View key={e.cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.info.color }}/>
            <Text style={{ flex: 1, fontSize: 14, color: T.text, letterSpacing: -0.1 }}>{e.info.label}</Text>
            <Text style={{ fontSize: 12, color: T.textFaint, minWidth: 32, textAlign: 'right' }}>
              {Math.round((e.total / total) * 100)}%
            </Text>
            <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', minWidth: 80, textAlign: 'right' }}>
              R$ {formatBRL(e.total)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SummaryScreen() {
  const { T } = useAppContext();
  const { db, isReady } = useDatabase();
  const navigation = useNavigation<any>();
  const [bills, setBills] = useState<Conta[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!db || !isReady) return;
      getAllContas(db, 'todas').then(setBills).catch(console.error);
    }, [db, isReady])
  );

  const sum = computeSummary(bills);
  const today = new Date();
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const history = [
    { m: 'Nov', total: 3180 },
    { m: 'Dez', total: 3520 },
    { m: 'Jan', total: 3280 },
    { m: 'Fev', total: 3410 },
    { m: 'Mar', total: 3150 },
    { m: 'Abr', total: sum.totalMonth || 3600 },
  ];
  const maxH = Math.max(...history.map(h => h.total));
  const avg = history.slice(0, -1).reduce((s, h) => s + h.total, 0) / (history.length - 1);
  const diff = sum.totalMonth - avg;

  const maxBill = bills.length > 0 ? bills.reduce((a, b) => a.valor > b.valor ? a : b) : null;
  const minBill = bills.length > 0 ? bills.reduce((a, b) => a.valor < b.valor ? a : b) : null;
  const recurringBills = bills.filter(b => b.recorrente);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader title="Resumo" subtitle={monthName} T={T} left="chevL" onLeft={() => navigation.goBack()}/>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero number */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Card T={T} style={{ padding: 22 }}>
            <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>
              Gasto total do mês
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 10 }}>
              <Text style={{ fontSize: 18, color: T.textDim, fontWeight: '500' }}>R$</Text>
              <Text style={{ fontSize: 40, fontWeight: '600', color: T.text, letterSpacing: -1.2, lineHeight: 44 }}>
                {formatBRL(sum.totalMonth).split(',')[0]}
              </Text>
              <Text style={{ fontSize: 22, color: T.textDim, fontWeight: '500', letterSpacing: -0.5, paddingBottom: 2 }}>
                ,{formatBRL(sum.totalMonth).split(',')[1]}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, alignSelf: 'flex-start',
              backgroundColor: diff < 0 ? 'rgba(77,232,143,0.12)' : 'rgba(255,184,77,0.14)',
            }}>
              <Icon name={diff < 0 ? 'arrDn' : 'arrUp'} size={12} color={diff < 0 ? T.success : T.warn} stroke={2.5}/>
              <Text style={{ color: diff < 0 ? T.success : T.warn, fontSize: 12, fontWeight: '500' }}>
                {diff < 0
                  ? `R$ ${formatBRL(-diff)} abaixo da média`
                  : `R$ ${formatBRL(diff)} acima da média`}
              </Text>
            </View>

            {/* Bar chart */}
            <View style={{ marginTop: 22, flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 110 }}>
              {history.map((h, i) => {
                const isLast = i === history.length - 1;
                const barH = (h.total / maxH) * 90;
                return (
                  <View key={h.m} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View style={{ height: barH, width: '100%', backgroundColor: isLast ? T.accent : T.borderStrong, borderRadius: 6 }}/>
                    <Text style={{ fontSize: 10, color: isLast ? T.text : T.textFaint, fontWeight: isLast ? '600' : '400' }}>{h.m}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Category breakdown */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: T.text, letterSpacing: -0.3, paddingHorizontal: 4, paddingBottom: 10 }}>
            Por categoria
          </Text>
          <Card T={T} style={{ padding: 20 }}>
            {bills.length > 0
              ? <CategoryBreakdown bills={bills} T={T}/>
              : <Text style={{ color: T.textDim, fontSize: 14 }}>Nenhuma conta este mês.</Text>}
          </Card>
        </View>

        {/* Stats grid */}
        {bills.length > 0 && (
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <StatCard T={T} label="Maior conta"
              value={`R$ ${formatBRL(maxBill!.valor)}`} sub={maxBill!.descricao}/>
            <StatCard T={T} label="Menor conta"
              value={`R$ ${formatBRL(minBill!.valor)}`} sub={minBill!.descricao}/>
            <StatCard T={T} label="Média diária"
              value={`R$ ${formatBRL(sum.totalMonth / 30)}`} sub={today.toLocaleDateString('pt-BR', { month: 'long' })}/>
            <StatCard T={T} label="Recorrentes"
              value={`${recurringBills.length} contas`}
              sub={`R$ ${formatBRL(recurringBills.reduce((s, b) => s + b.valor, 0))}`}/>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
