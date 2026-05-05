import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { CATEGORIES } from '../../theme/tokens';

interface Props {
  category: string;
  size?: number;
  rounded?: number;
}

export function CategoryIcon({ category, size = 40, rounded = 12 }: Props) {
  const normalizedCat = (category || 'outros').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  const cat = CATEGORIES[normalizedCat] || CATEGORIES.outros;
  return (
    <View style={{
      width: size, height: size, borderRadius: rounded,
      backgroundColor: cat.bg,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon name={cat.icon} size={size * 0.5} color={cat.color} stroke={2} />
    </View>
  );
}
