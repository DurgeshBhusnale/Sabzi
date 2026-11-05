import type { ComponentType } from 'react';
import type { ColorTokens } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';

export type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number; fill?: string }>;

/** Outline icons, 24 dp, 1.75 stroke (design brief §2.6). */
export function Icon({
  icon: IconCmp,
  size,
  color = 'textPrimary',
  filled = false,
}: {
  icon: LucideIcon;
  size?: number;
  color?: keyof ColorTokens;
  filled?: boolean;
}) {
  const t = useTheme();
  const c = t.colors[color];
  return (
    <IconCmp
      size={size ?? t.layout.iconSize}
      color={c}
      strokeWidth={t.layout.iconStroke}
      fill={filled ? c : 'none'}
    />
  );
}
