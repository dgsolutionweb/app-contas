import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { useDatabase } from '../hooks/useDatabase';
import { getAllContas } from '../database/contasRepository';
import { AppHeader } from '../components/ui/AppHeader';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { BillRow } from '../components/ui/BillRow';
import { Icon } from '../components/ui/Icon';
import { CATEGORIES } from '../theme/tokens';
import { computeSummary, formatBRL, groupLabel } from '../utils/billHelpers';
import type { Conta } from '../types';

export function BillsScreen() {
  const { T } = useAppContext();
  const { db, isReady } = useDatabase();
  const navigation = useNavigation<any>();
  const [bills, setBills] = useState<Conta[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all' | 'paid'>('pending');
  const [cat, setCat] = useState('all');

  useFocusEffect(
    useCallback(() => {
      if (!db || !isReady) return;
      getAllContas(db, 'todas').then(setBills).catch(console.error);
    }, [db, isReady])
  );

  const sum = computeSummary(bills);

  let filtered = [...bills];
  if (filter === 'pending') filtered = filtered.filter(b => !b.pago);
  if (filter === 'paid') filtered = filtered.filter(b => !!b.pago);
  if (cat !== 'all') filtered = filtered.filter(b => b.categoria === cat);
  filtered.sort((a, b) => Number(a.pago) - Number(b.pago) || a.vencimento.localeCompare(b.vencimento));

  const groups: Record<string, Conta[]> = {};
  for (const b of filtered) {
    const key = b.pago ? 'Pagas' : groupLabel(b.vencimento);
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }

  const cats = ['all', ...Array.from(new Set(bills.map(b => b.categoria)))];

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader
        title="Contas"
        subtitle={`${sum.countTotal} no mês · ${sum.pending.length} pendentes`}
        T={T}
        right={
          <TouchableOpacity activeOpacity={0.7} style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="search" size={18} color={T.text} stroke={1.8}/>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Summary stats */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 16 }}>
            <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>Pendente</Text>
            <Text style={{ fontSize: 22, fontWeight: '600', color: T.text, letterSpacing: -0.6, marginTop: 6 }}>
              R$ {formatBRL(sum.totalPending)}
            </Text>
            <Text style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{sum.pending.length} contas</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 16 }}>
            <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>Pago</Text>
            <Text style={{ fontSize: 22, fontWeight: '600', color: T.success, letterSpacing: -0.6, marginTop: 6 }}>
              R$ {formatBRL(sum.totalPaid)}
            </Text>
            <Text style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{sum.paid.length} contas</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 8, flexDirection: 'row' }}>
          <Chip T={T} active={filter === 'pending'} onPress={() => setFilter('pending')}>Pendentes</Chip>
          <Chip T={T} active={filter === 'all'} onPress={() => setFilter('all')}>Todas</Chip>
          <Chip T={T} active={filter === 'paid'} onPress={() => setFilter('paid')}>Pagas</Chip>
        </ScrollView>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8, flexDirection: 'row' }}>
          {cats.map(c => (
            <Chip key={c} T={T} active={cat === c} onPress={() => setCat(c)} small>
              {c === 'all' ? 'Todas categorias' : (CATEGORIES[c]?.label || c)}
            </Chip>
          ))}
        </ScrollView>

        {/* Groups */}
        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          {Object.keys(groups).length === 0 && (
            <Text style={{ textAlign: 'center', paddingVertical: 60, color: T.textDim, fontSize: 14 }}>
              Nenhuma conta nesse filtro.
            </Text>
          )}
          {Object.entries(groups).map(([label, items]) => (
            <View key={label}>
              <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 8 }}>
                {label}
              </Text>
              <Card T={T} style={{ padding: 0, paddingHorizontal: 20 }}>
                {items.map((b, i) => (
                  <View key={b.id} style={{ borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: T.border }}>
                    <BillRow bill={b} T={T} dense onPress={() => navigation.navigate('BillDetail', { bill: b })}/>
                  </View>
                ))}
              </Card>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
