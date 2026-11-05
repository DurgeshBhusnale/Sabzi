import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import type { ColorTokens } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

export type PillStatus = 'at_gate' | 'expected' | 'leaving_soon' | 'left' | 'not_coming' | 'verified' | 'sold_out' | 'deal' | 'waiting' | 'will_bring' | 'cant_bring' | 'new';

type K = keyof ColorTokens;
const STYLE: Record<PillStatus, { bg: K; fg: K; dot?: K }> = {
  at_gate: { bg: 'primaryTint', fg: 'primary', dot: 'brandLeaf' },
  expected: { bg: 'surface2', fg: 'textSecondary' },
  leaving_soon: { bg: 'dealAmberTint', fg: 'dealAmberText' },
  left: { bg: 'surface2', fg: 'textMuted' },
  not_coming: { bg: 'errorTint', fg: 'error' },
  verified: { bg: 'primaryTint', fg: 'primary' },
  sold_out: { bg: 'errorTint', fg: 'error' },
  deal: { bg: 'dealAmber', fg: 'dealAmberText' },
  waiting: { bg: 'surface2', fg: 'textSecondary' },
  will_bring: { bg: 'primaryTint', fg: 'primary' },
  cant_bring: { bg: 'errorTint', fg: 'error' },
  new: { bg: 'infoTint', fg: 'info' },
};

/** Pulsing dot for "At the gate" (respects reduced motion by being subtle and short). */
function PulseDot({ color, large }: { color: string; large: boolean }) {
  const t = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.6, duration: t.motion.pulseMs / 2, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: t.motion.pulseMs / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, t.motion.pulseMs]);
  const size = large ? 10 : 8;
  return (
    <View style={{ width: size, height: size }} testID="pulse-dot">
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size, backgroundColor: color, opacity: 0.35, transform: [{ scale }] }]} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: size, backgroundColor: color }]} />
    </View>
  );
}

export function StatusPill({ status, label, large = false }: { status: PillStatus; label: string; large?: boolean }) {
  const t = useTheme();
  const s = STYLE[status];
  // Large hero variant uses primary (not brand-leaf) so white text clears AA.
  const bg = large && status === 'at_gate' ? t.colors.primary : t.colors[s.bg];
  const fg: K = large && status === 'at_gate' ? 'onPrimary' : s.fg;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      testID={`pill-${status}`}
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderRadius: t.radius.pill,
          paddingHorizontal: large ? t.spacing.md : t.spacing.sm,
          paddingVertical: large ? t.spacing.xs : t.spacing.xxs,
          gap: t.spacing.xs - 2,
        },
      ]}
    >
      {s.dot ? <PulseDot color={large ? t.colors.onPrimary : t.colors[s.dot]} large={large} /> : null}
      {status === 'verified' ? <Icon icon={BadgeCheck} size={16} color="primary" /> : null}
      <Text variant={large ? 'button' : 'caption'} weight="600" color={fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
});
