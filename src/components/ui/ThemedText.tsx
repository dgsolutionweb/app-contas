import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAppContext } from '../../context/AppContext';

interface Props extends TextProps {
  muted?: boolean;
}

export function ThemedText({ muted, style, ...props }: Props) {
  const { colors } = useAppContext();
  return (
    <Text
      style={[{ color: muted ? colors.textMuted : colors.text }, style]}
      {...props}
    />
  );
}
