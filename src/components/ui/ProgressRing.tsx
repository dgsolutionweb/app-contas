import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import type { ThemeTokens } from '../../theme/tokens';

interface Props {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  T: ThemeTokens;
  color?: string;
}

export function ProgressRing({ value, max, size = 56, stroke = 5, T, color }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={T.borderStrong} strokeWidth={stroke}
      />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color || T.accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}
