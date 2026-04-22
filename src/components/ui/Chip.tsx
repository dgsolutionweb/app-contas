import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { ThemeTokens } from '../../theme/tokens';

interface Props {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  T: ThemeTokens;
  small?: boolean;
}

export function Chip({ children, active, onPress, T, small }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: active ? T.text : T.chipBg,
        borderRadius: 100,
        paddingHorizontal: small ? 12 : 14,
        paddingVertical: small ? 6 : 8,
      }}
    >
      <Text style={{
        color: active ? T.bg : T.text,
        fontSize: small ? 12 : 13,
        fontWeight: '500',
        letterSpacing: -0.1,
      }}>{children}</Text>
    </TouchableOpacity>
  );
}
