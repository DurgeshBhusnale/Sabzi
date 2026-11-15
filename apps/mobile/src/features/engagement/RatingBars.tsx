import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui';

/** Visible reviews per star, for the B-09 breakdown. */
export function starCounts(rs: { stars: number }[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rs) if (r.stars >= 1 && r.stars <= 5) c[r.stars as 1 | 2 | 3 | 4 | 5] += 1;
  return c;
}

/** Star breakdown, 5 → 1. Lives on B-09 All reviews (UX-13, owner decision §6 #3). */
export function RatingBars({ counts }: { counts: Record<1 | 2 | 3 | 4 | 5, number> }) {
  const t = useTheme();
  const total = Math.max(1, counts[1] + counts[2] + counts[3] + counts[4] + counts[5]);
  return (
    <View style={{ gap: t.spacing.xxs }} testID="rating-bars">
      {([5, 4, 3, 2, 1] as const).map((n) => (
        <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
          <Text variant="caption" weight="400" color="textSecondary" style={{ width: 10 }}>{String(n)}</Text>
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: t.colors.surface2 }}>
            <View testID={`bar-${n}`} style={{ height: 6, borderRadius: 3, width: `${(counts[n] / total) * 100}%`, backgroundColor: t.colors.star }} />
          </View>
        </View>
      ))}
    </View>
  );
}
