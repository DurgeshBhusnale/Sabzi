import { StyleSheet, View } from 'react-native';
import { formatTimeWindow } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { en } from '../i18n/en';

export type StopRowState = 'upcoming' | 'current' | 'done' | 'skipped';

/** v4 vendor stop: timeline dot + line on the left, boxed row (society · gate, window, followers). */
export function StopRow({
  society,
  gate,
  windowStart,
  windowEnd,
  followers,
  state,
  right,
  last = false,
}: {
  society: string;
  gate: string;
  windowStart: string;
  windowEnd: string;
  followers?: number;
  state: StopRowState;
  right?: React.ReactNode;
  last?: boolean;
}) {
  const t = useTheme();
  const c = t.colors;
  const window = formatTimeWindow(windowStart, windowEnd);
  const sub =
    state === 'current' ? en.stops.youreHere(window) : state === 'done' ? en.stops.done(window) : state === 'skipped' ? en.stops.notGoing : window;
  const current = state === 'current';
  const faded = state === 'done' || state === 'skipped';
  return (
    <View
      testID={`stop-row-${state}`}
      accessible
      accessibilityLabel={`${society}, ${gate}. ${sub}${followers != null ? `. ${en.stops.followers(followers)}` : ''}`}
      style={[styles.row, { gap: t.spacing.sm, alignItems: 'stretch', opacity: faded ? 0.6 : 1 }]}
    >
      <View style={{ width: 14, alignItems: 'center' }}>
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            marginTop: 18,
            borderWidth: 2,
            borderColor: current ? c.accent : state === 'skipped' ? c.error : state === 'done' ? c.textMuted : c.border,
            backgroundColor: current ? c.accent : state === 'done' ? c.textMuted : c.surface,
          }}
        />
        {last ? null : <View style={{ flex: 1, width: 2, backgroundColor: c.border }} />}
      </View>
      <View
        style={[
          styles.row,
          styles.flex,
          {
            paddingHorizontal: 14,
            paddingVertical: t.spacing.sm,
            marginBottom: t.spacing.xs,
            borderRadius: t.radius.button,
            borderWidth: 1,
            borderColor: current ? c.accent : c.border,
            backgroundColor: current ? c.primaryTint : c.surface,
            gap: t.spacing.sm,
          },
        ]}
      >
        <View style={[styles.flex, { gap: 2 }]}>
          <Text variant="label" weight="600" strike={state === 'done'}>{`${society} · ${gate}`}</Text>
          <Text variant="caption" weight={current || state === 'skipped' ? '600' : '400'} color={current ? 'onPrimaryTint' : state === 'skipped' ? 'error' : 'textSecondary'}>
            {sub}
          </Text>
        </View>
        {right ?? (followers != null ? <Text variant="caption" color="textSecondary">{en.stops.followers(followers)}</Text> : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
