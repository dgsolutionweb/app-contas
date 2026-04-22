import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppContext } from '../../context/AppContext';

interface Props extends ViewProps {
  variant?: 'background' | 'surface' | 'surfaceAlt';
}

export function ThemedView({ variant = 'background', style, ...props }: Props) {
  const { colors } = useAppContext();
  const bg = colors[variant];
  return <View style={[{ backgroundColor: bg }, style]} {...props} />;
}
