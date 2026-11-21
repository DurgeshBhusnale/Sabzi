import { Pressable, StyleSheet, View } from 'react-native';
import { CircleCheck, Circle, Clock } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * Request flow v2: one of the vendor's next visits, as a selectable tile. The same tile is used when there is
 * only one visit (it is shown pre-selected) so the buyer always sees what they are ordering for.
 */
export function SlotTile({
  day,
  window,
  cutoff,
  selected,
  onPress,
  testID,
}: {
  /** "Tomorrow morning" */
  day: string;
  /** "8:00–8:45 AM · Gate 1" */
  window: string;
  /** "Order by 10:30 PM tonight" */
  cutoff: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={`${day}, ${window}. ${cutoff}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          minHeight: t.layout.minTouch + 28,
          borderRadius: t.radius.card,
          borderWidth: 2,
          borderColor: selected ? c.primary : c.border,
          backgroundColor: selected ? c.primaryTint : c.surface,
          paddingVertical: t.spacing.sm,
          paddingHorizontal: t.spacing.md,
          gap: t.spacing.sm,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Icon icon={selected ? CircleCheck : Circle} size={24} color={selected ? 'primary' : 'textMuted'} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" weight="700" color={selected ? 'onPrimaryTint' : 'textPrimary'}>{day}</Text>
        <Text variant="bodySmall" color={selected ? 'onPrimaryTint' : 'textSecondary'}>{window}</Text>
        <View style={[styles.row, { gap: 4, marginTop: 2 }]}>
          <Icon icon={Clock} size={14} color="textSecondary" />
          <Text variant="caption" color="textSecondary">{cutoff}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
