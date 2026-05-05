import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { useDatabase } from '../hooks/useDatabase';
import { getAllContas, payMonthBills } from '../database/contasRepository';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { BillRow } from '../components/ui/BillRow';
import { CATEGORIES } from '../theme/tokens';
import {
  computeSummary, formatBRL, formatBRLFull, daysUntil,
} from '../utils/billHelpers';
import type { Conta } from '../types';

type HeroFilter = 'monthly' | 'recurring' | 'installments' | 'oneOff';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isInstallmentBill(bill: Conta): boolean {
  return /\(\d+\/\d+\)\s*$/.test(bill.descricao);
}

function matchesHeroFilter(bill: Conta, filter: HeroFilter): boolean {
  if (filter === 'recurring') return bill.recorrente === 1;
  if (filter === 'installments') return isInstallmentBill(bill);
  if (filter === 'oneOff') return bill.recorrente === 0 && !isInstallmentBill(bill);
  return true;
}

function filterLabel(filter: HeroFilter): string {
  if (filter === 'recurring') return 'Recorrentes';
  if (filter === 'installments') return 'Parcelas';
  if (filter === 'oneOff') return 'Avulsas';
  return 'Mensais';
}

function CategoryBreakdown({ bills, T }: { bills: Conta[]; T: any }) {
  const { hideValues } = useAppContext();
  const sum = computeSummary(bills);
  const entries = Object.entries(sum.byCat)
    .map(([k, v]) => {
      const info = CATEGORIES[k] || { ...CATEGORIES.outros, label: k.charAt(0).toUpperCase() + k.slice(1) };
      return { cat: k, ...v, info };
    })
    .sort((a, b) => b.total - a.total);
  const total = sum.totalMonth;

  return (
    <View>
      {/* segmented bar */}
      <View style={{ height: 10, borderRadius: 100, overflow: 'hidden', flexDirection: 'row', gap: 2, marginBottom: 16 }}>
        {entries.map(e => (
          <View key={e.cat} style={{ flex: e.total / total, backgroundColor: e.info.color, minWidth: 2 }}/>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        {entries.slice(0, 5).map(e => (
          <View key={e.cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.info.color }}/>
            <Text style={{ flex: 1, fontSize: 14, color: T.text, letterSpacing: -0.1 }}>{e.info.label}</Text>
            <Text style={{ fontSize: 12, color: T.textFaint, minWidth: 32, textAlign: 'right' }}>
              {Math.round((e.total / total) * 100)}%
            </Text>
            <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.1, minWidth: 80, textAlign: 'right' }}>
              {hideValues ? '••••' : `R$ ${formatBRL(e.total)}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'bom dia';
  if (hour >= 12 && hour < 18) return 'boa tarde';
  return 'boa noite';
}

export function HomeScreen() {
  const { T, hideValues, toggleHideValues, settings } = useAppContext();
  const { db, isReady } = useDatabase();
  const navigation = useNavigation<any>();
  const [bills, setBills] = useState<Conta[]>([]);
  const [heroMonthOffset, setHeroMonthOffset] = useState(0);
  const [heroFilter, setHeroFilter] = useState<HeroFilter>('monthly');

  useFocusEffect(
    useCallback(() => {
      if (!db || !isReady) return;
      getAllContas(db, 'todas').then(setBills).catch(console.error);
    }, [db, isReady])
  );

  const insets = useSafeAreaInsets();
  const sum = computeSummary(bills);
  const today = new Date();
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
  const heroDate = new Date(today.getFullYear(), today.getMonth() + heroMonthOffset, 1);
  const heroMonthName = heroDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const heroMonthKey = monthKey(heroDate);
  const heroBills = bills.filter(
    (bill) => bill.vencimento.startsWith(heroMonthKey) && matchesHeroFilter(bill, heroFilter)
  );
  const heroSum = computeSummary(heroBills);
  const heroTitle = `${filterLabel(heroFilter)} de ${heroMonthName}`;
  const dueThisWeek = sum.upcoming.filter(b => {
    const d = daysUntil(b.vencimento);
    return d >= 0 && d <= 7;
  });
  const dueThisWeekTotal = dueThisWeek.reduce((s, b) => s + b.valor, 0);
  const isDark = T.bg === '#0A0A0B';

  return (
    <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 14, paddingBottom: 8, gap: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: T.accent,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: T.accentInk, fontWeight: '700', fontSize: 15, letterSpacing: -0.3 }}>
            {settings.userName ? settings.userName.charAt(0).toUpperCase() : 'V'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>
            Olá, {getGreeting()}
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: T.text, letterSpacing: -0.3 }}>
            {settings.userName || 'Você'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleHideValues}
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name={hideValues ? 'eyeOff' : 'eye'} size={18} color={T.text} stroke={1.8}/>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="bell" size={18} color={T.text} stroke={1.8}/>
        </TouchableOpacity>
      </View>

      {/* HERO — Total do mês */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <View style={{
          borderRadius: 28, overflow: 'hidden', padding: 22,
          backgroundColor: isDark ? '#141416' : '#FFFFFF',
          borderWidth: 1, borderColor: T.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, color: T.textDim, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '600' }}>
                {heroTitle}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: T.chipBg }}>
              <Text style={{ fontSize: 10, color: T.textDim, fontWeight: '500' }}>
                {heroSum.countPaid}/{heroSum.countTotal} pagas
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setHeroMonthOffset((current) => current - 1)}
                activeOpacity={0.7}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: T.chipBg,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="chevL" size={15} color={T.text} stroke={2}/>
              </TouchableOpacity>
              <Text style={{ color: T.text, fontSize: 13, fontWeight: '600', letterSpacing: -0.15, textTransform: 'capitalize' }}>
                {heroMonthName}
              </Text>
              <TouchableOpacity
                onPress={() => setHeroMonthOffset((current) => current + 1)}
                activeOpacity={0.7}
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: T.chipBg,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="chevR" size={15} color={T.text} stroke={2}/>
              </TouchableOpacity>
            </View>
            {heroMonthOffset !== 0 && (
              <TouchableOpacity onPress={() => setHeroMonthOffset(0)} activeOpacity={0.7}>
                <Text style={{ color: T.textDim, fontSize: 12, fontWeight: '500' }}>Hoje</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, flexDirection: 'row', paddingBottom: 6, marginBottom: 14 }}
          >
            <Chip T={T} active={heroFilter === 'monthly'} onPress={() => setHeroFilter('monthly')} small>
              Mensais
            </Chip>
            <Chip T={T} active={heroFilter === 'recurring'} onPress={() => setHeroFilter('recurring')} small>
              Recorrentes
            </Chip>
            <Chip T={T} active={heroFilter === 'installments'} onPress={() => setHeroFilter('installments')} small>
              Parcelas
            </Chip>
            <Chip T={T} active={heroFilter === 'oneOff'} onPress={() => setHeroFilter('oneOff')} small>
              Avulsas
            </Chip>
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
            <Text style={{ fontSize: 20, color: T.text, fontWeight: '500', letterSpacing: -0.4 }}>R$</Text>
            {hideValues ? (
              <Text style={{ fontSize: 44, fontWeight: '600', color: T.text, letterSpacing: -1.6, lineHeight: 48, transform: [{ translateY: 6 }] }}>
                ••••
              </Text>
            ) : (
              <>
                <Text style={{ fontSize: 44, fontWeight: '600', color: T.text, letterSpacing: -1.6, lineHeight: 48 }}>
                  {formatBRL(heroSum.totalPending).split(',')[0]}
                </Text>
                <Text style={{ fontSize: 22, color: T.textDim, fontWeight: '500', letterSpacing: -0.6, paddingBottom: 2 }}>
                  ,{formatBRL(heroSum.totalPending).split(',')[1]}
                </Text>
              </>
            )}
          </View>
          <Text style={{ fontSize: 13, color: T.textDim, letterSpacing: -0.15 }}>
            {heroSum.pending.length} pendentes · R$ {formatBRL(heroSum.totalPaid)} já pagos
          </Text>

          {/* Progress bar */}
          <View style={{ marginTop: 18, height: 6, backgroundColor: T.borderStrong, borderRadius: 100, overflow: 'hidden' }}>
            <View style={{
              height: '100%',
              width: `${heroSum.totalMonth > 0 ? (heroSum.totalPaid / heroSum.totalMonth) * 100 : 0}%`,
              backgroundColor: T.accent,
              borderRadius: 100,
            }}/>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.85}
              style={{
                flex: 1, backgroundColor: T.accent,
                borderRadius: 100, paddingVertical: 12, paddingHorizontal: 16,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Icon name="sparkle" size={15} color={T.accentInk} stroke={2.5}/>
              <Text style={{ color: T.accentInk, fontSize: 14, fontWeight: '600', letterSpacing: -0.15 }}>Adicionar conta</Text>
            </TouchableOpacity>

            {heroSum.pending.length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await payMonthBills(db, heroMonthKey);
                    getAllContas(db, 'todas').then(setBills).catch(console.error);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                activeOpacity={0.85}
                style={{
                  backgroundColor: T.chipBg, borderWidth: 1, borderColor: T.border,
                  borderRadius: 100, paddingVertical: 12, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <Icon name="check" size={15} color={T.text} stroke={2}/>
                <Text style={{ color: T.text, fontSize: 14, fontWeight: '500', letterSpacing: -0.15 }}>Pagar mês</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => navigation.navigate('Summary')}
              activeOpacity={0.85}
              style={{
                backgroundColor: T.chipBg, borderWidth: 1, borderColor: T.border,
                borderRadius: 100, paddingVertical: 12, paddingHorizontal: 16,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              <Icon name="pie" size={15} color={T.text} stroke={1.8}/>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Essa semana */}
      {dueThisWeek.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Card T={T} style={{ padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: 20, paddingBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600', marginBottom: 4 }}>
                    Essa semana
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: T.text, letterSpacing: -0.4 }}>
                    Você deve pagar {hideValues ? '••••' : formatBRLFull(dueThisWeekTotal)}
                  </Text>
                  <Text style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>
                    em {dueThisWeek.length} {dueThisWeek.length === 1 ? 'conta' : 'contas'} até domingo
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Bills')}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                >
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '500' }}>Ver todas</Text>
                  <Icon name="chevR" size={16} color={T.text} stroke={2}/>
                </TouchableOpacity>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: T.border, paddingHorizontal: 0, marginTop: 8 }}>
                {dueThisWeek.slice(0, 3).map(b => (
                  <BillRow
                    key={b.id} bill={b} T={T} dense
                    onPress={() => navigation.navigate('BillDetail', { bill: b })}
                  />
                ))}
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Gastos por categoria */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: T.text, letterSpacing: -0.3 }}>Onde vai o dinheiro</Text>
          <Text style={{ fontSize: 12, color: T.textFaint }}>{monthName}</Text>
        </View>
        <Card T={T} style={{ padding: 20 }}>
          {bills.length > 0
            ? <CategoryBreakdown bills={bills} T={T} />
            : <Text style={{ color: T.textDim, fontSize: 14 }}>Nenhuma conta este mês.</Text>
          }
        </Card>
      </View>

      {/* Próximos vencimentos */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: T.text, letterSpacing: -0.3 }}>Próximos vencimentos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bills')} activeOpacity={0.7}>
            <Text style={{ color: T.textDim, fontSize: 12, fontWeight: '500' }}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        <Card T={T} style={{ padding: 0, paddingHorizontal: 20 }}>
          {sum.upcoming.length === 0
            ? <Text style={{ color: T.textDim, fontSize: 14, padding: 20 }}>Nenhuma conta pendente.</Text>
            : sum.upcoming.slice(0, 4).map((b, i, a) => (
                <View key={b.id} style={{ borderBottomWidth: i < a.length - 1 ? 1 : 0, borderBottomColor: T.border }}>
                  <BillRow bill={b} T={T} dense onPress={() => navigation.navigate('BillDetail', { bill: b })}/>
                </View>
              ))
          }
        </Card>
      </View>
    </ScrollView>
  );
}
