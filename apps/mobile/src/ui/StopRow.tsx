import { StyleSheet, View } from 'react-native';
import { formatTimeWindow } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { en } from '../i18n/en';

export type StopRowState = 'upcoming' | 'current' | 'done' | 'skipped';

/** Vendor stop row: society, gate, time window, follower count. */
export function StopRow({
  society,
  gate,
  windowStart,
  windowEnd,
  followers,
  state,
  right,
}: {
  society: string;
  gate: string;
  windowStart: string;
  windowEnd: string;
  followers?: number;
  state: StopRowState;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  const c = t.colors;
  const window = formatTimeWindow(windowStart, windowEnd);
  const sub =
    state === 'current' ? en.stops.youreHere(window) : state === 'done' ? en.stops.done(window) : state === 'skipped' ? en.stops.notGoing : window;
  return (
    <View
      testID={`stop-row-${state}`}
      accessible
      accessibilityLabel={`${society}, ${gate}. ${sub}${followers != null ? `. ${en.stops.followers(followers)}` : ''}`}
      style={[
        styles.row,
        {
          minHeight: t.layout.listRowWithImage,
          paddingHorizontal: t.spacing.md,
          gap: t.spacing.sm,
          backgroundColor: state === 'current' ? c.primaryTint : 'transparent',
        },
      ]}
    >
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: state === 'current' ? c.brandLeaf : state === 'skipped' ? c.error : c.textMuted,
          backgroundColor: state === 'current' ? c.brandLeaf : state === 'done' ? c.textMuted : 'transparent',
        }}
      />
      <View style={styles.flex}>
        <Text weight="600" color={state === 'done' || state === 'skipped' ? 'textSecondary' : 'textPrimary'} strike={state === 'done'}>
          {`${society} · ${gate}`}
        </Text>
        <Text variant="bodySmall" weight={state === 'current' || state === 'skipped' ? '600' : '400'} color={state === 'current' ? 'primary' : state === 'skipped' ? 'error' : 'textSecondary'}>
          {sub}
        </Text>
      </View>
      {right ?? (followers != null ? <Text variant="h2">{String(followers)}</Text> : null)}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
