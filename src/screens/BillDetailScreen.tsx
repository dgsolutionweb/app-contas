import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { useDatabase } from '../hooks/useDatabase';
import { markAsPaid, deleteConta } from '../database/contasRepository';
import { AppHeader } from '../components/ui/AppHeader';
import { Card } from '../components/ui/Card';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { Icon } from '../components/ui/Icon';
import { CATEGORIES } from '../theme/tokens';
import { daysUntil, formatDueShort, formatDateLong, formatBRL } from '../utils/billHelpers';
import type { Conta } from '../types';

function DetailRow({ T, label, value, icon, last }: { T: any; label: string; value: string; icon: string; last?: boolean }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: T.border,
    }}>
      <Icon name={icon} size={18} color={T.textDim} stroke={1.8}/>
      <Text style={{ flex: 1, fontSize: 13, color: T.textDim, letterSpacing: -0.05 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.15, textAlign: 'right', maxWidth: 180 }}>{value}</Text>
    </View>
  );
}

export function BillDetailScreen() {
  const { T } = useAppContext();
  const { db } = useDatabase();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [bill, setBill] = useState<Conta>(route.params?.bill);

  const cat = CATEGORIES[bill.categoria] || CATEGORIES.outros;
  const d = daysUntil(bill.vencimento);
  const overdue = !bill.pago && d < 0;

  const handlePay = useCallback(async () => {
    if (!db) return;
    await markAsPaid(db, bill.id);
    setBill(prev => ({ ...prev, pago: 1 }));
  }, [db, bill.id]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remover conta',
      `Quer remover "${bill.descricao}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => {
          if (!db) return;
          await deleteConta(db, bill.id);
          navigation.goBack();
        }},
      ]
    );
  }, [db, bill, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader
        title="Detalhe" T={T} left="chevL" onLeft={() => navigation.goBack()}
        right={
          <TouchableOpacity activeOpacity={0.7} onPress={handleDelete} style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="trash" size={18} color={T.danger} stroke={2}/>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' }}>
          <View style={{ marginBottom: 16 }}>
            <CategoryIcon category={bill.categoria} size={72} rounded={22}/>
          </View>
          <Text style={{ fontSize: 13, color: T.textDim, letterSpacing: -0.1, marginBottom: 4 }}>{cat.label}</Text>
          <Text style={{ fontSize: 22, fontWeight: '600', color: T.text, letterSpacing: -0.5, marginBottom: 14 }}>
            {bill.descricao}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontSize: 18, color: T.textDim, fontWeight: '500' }}>R$</Text>
            <Text style={{ fontSize: 48, fontWeight: '600', color: T.text, letterSpacing: -1.6, lineHeight: 52 }}>
              {formatBRL(bill.valor).split(',')[0]}
            </Text>
            <Text style={{ fontSize: 22, color: T.textDim, fontWeight: '500', letterSpacing: -0.5, paddingBottom: 2 }}>
              ,{formatBRL(bill.valor).split(',')[1]}
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            marginTop: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
            backgroundColor: bill.pago
              ? 'rgba(77,232,143,0.12)'
              : overdue ? 'rgba(255,94,94,0.12)' : T.chipBg,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3,
              backgroundColor: bill.pago ? T.success : overdue ? T.danger : T.text }}/>
            <Text style={{
              color: bill.pago ? T.success : overdue ? T.danger : T.text,
              fontSize: 12, fontWeight: '500',
            }}>
              {bill.pago ? 'Paga' : overdue ? 'Atrasada' : formatDueShort(bill.vencimento)}
            </Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Card T={T} style={{ padding: 0, paddingHorizontal: 20 }}>
            <DetailRow T={T} label="Vencimento" value={formatDateLong(bill.vencimento)} icon="calendar"/>
            <DetailRow T={T} label="Categoria" value={cat.label} icon="tag"/>
            <DetailRow T={T} label="Recorrência" value={bill.recorrente ? 'Mensal' : 'Conta única'} icon="repeat"
              last={!bill.nota}/>
            {!!bill.nota && <DetailRow T={T} label="Observação" value={bill.nota!} icon="pencil" last/>}
          </Card>
        </View>

        {/* Actions */}
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10 }}>
          {!bill.pago && (
            <TouchableOpacity onPress={handlePay} activeOpacity={0.85} style={{
              flex: 1, backgroundColor: T.accent, borderRadius: 100,
              paddingVertical: 14, paddingHorizontal: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name="check" size={16} color={T.accentInk} stroke={2.5}/>
              <Text style={{ color: T.accentInk, fontSize: 15, fontWeight: '600', letterSpacing: -0.15 }}>
                Marcar como paga
              </Text>
            </TouchableOpacity>
          )}
          {bill.pago && (
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <Icon name="check" size={16} color={T.success} stroke={2.5}/>
              <Text style={{ color: T.success, fontSize: 15, fontWeight: '500' }}>Conta paga</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
