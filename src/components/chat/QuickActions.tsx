import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

const QUICK_ACTIONS = [
  { label: 'Pendentes', short: 'PE', message: 'listar pendentes' },
  { label: 'Resumo', short: 'RS', message: 'resumo do mês' },
  { label: 'Todas', short: 'TD', message: 'listar todas' },
  { label: 'Ajuda', short: 'AJ', message: 'ajuda' },
];

interface Props {
  onSend: (text: string) => void;
}

export function QuickActions({ onSend }: Props) {
  const { colors } = useAppContext();
  const { width } = useWindowDimensions();
  const compact = width < 380;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.message}
          style={[
            styles.chip,
            compact ? styles.chipCompact : null,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            },
          ]}
          onPress={() => onSend(action.message)}
          activeOpacity={0.7}
        >
          <View style={[styles.chipIcon, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.chipIconText, { color: colors.primary }]}>{action.short}</Text>
          </View>
          <Text style={[styles.chipText, compact ? styles.chipTextCompact : null, { color: colors.primary }]}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipIconText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  chipTextCompact: {
    fontSize: 12,
  },
});
