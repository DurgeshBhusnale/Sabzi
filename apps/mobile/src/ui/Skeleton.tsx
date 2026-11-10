import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/** Shimmer block on surface-2 (design brief §8.5). */
export function Skeleton({ width = '100%', height = 16, round = false }: { width?: DimensionValue; height?: number; round?: boolean }) {
  const t = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      testID="skeleton"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, opacity, borderRadius: round ? height / 2 : t.radius.input, backgroundColor: t.colors.surface2 }}
    />
  );
}

export type SkeletonKind = 'vendorCard' | 'menuRow' | 'statTile' | 'list';

export function SkeletonBlock({ kind, count = 1 }: { kind: SkeletonKind; count?: number }) {
  const t = useTheme();
  const card = { borderRadius: t.radius.button, padding: t.spacing.sm, backgroundColor: t.colors.bg };
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" testID={`skeleton-${kind}`} style={{ gap: t.spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => {
        if (kind === 'statTile') {
          return (
            <View key={i} style={[card, { gap: t.spacing.xs }]}>
              <Skeleton width="50%" height={28} />
              <Skeleton width="80%" height={12} />
            </View>
          );
        }
        return (
          <View key={i} style={[card, styles.row, { gap: t.spacing.sm }]}>
            <Skeleton width={kind === 'menuRow' ? 36 : 48} height={kind === 'menuRow' ? 36 : 48} round={kind !== 'menuRow'} />
            <View style={[styles.flex, { gap: t.spacing.xs }]}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="85%" height={12} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
