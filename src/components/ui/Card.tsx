import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import type { ThemeTokens } from '../../theme/tokens';

interface Props {
  children: React.ReactNode;
  T: ThemeTokens;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ children, T, style, onPress }: Props) {
  const base: ViewStyle = {
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: T.border,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[base, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}
