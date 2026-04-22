import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import type { ThemeTokens } from '../../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  T: ThemeTokens;
  left?: string;
  onLeft?: () => void;
  right?: React.ReactNode;
}

export function AppHeader({ title, subtitle, T, left, onLeft, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16,
      gap: 12,
    }}>
      {left && (
        <TouchableOpacity
          onPress={onLeft}
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: T.surface,
            borderWidth: 1, borderColor: T.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name={left} size={18} color={T.text} stroke={2} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: T.text, letterSpacing: -0.6, lineHeight: 24 }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 13, color: T.textDim, marginTop: 2, letterSpacing: -0.1 }}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}
