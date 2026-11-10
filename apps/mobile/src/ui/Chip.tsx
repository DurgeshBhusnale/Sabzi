import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type ChipKind = 'filter' | 'tag' | 'unit';

/** Filter chip, selectable review tag, or vendor unit chip (kg, 500 g…). 48 dp hit area always. */
export function Chip({
  label,
  selected = false,
  disabled = false,
  kind = 'filter',
  onPress,
  testID,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  kind?: ChipKind;
  onPress?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  const unit = kind === 'unit';
  const height = unit ? t.heights.unitChip : t.heights.chip;
  // v4: selected chips are solid forest with white text; idle chips are soft cream-grey
  const bg = selected ? c.primary : unit ? c.surface2 : c.surface;
  const fg = disabled ? 'textMuted' : selected ? 'onPrimary' : 'textPrimary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole={kind === 'filter' ? 'button' : 'checkbox'}
      accessibilityState={{ selected, checked: kind === 'filter' ? undefined : selected, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ top: (t.layout.minTouch - height) / 2, bottom: (t.layout.minTouch - height) / 2 }}
      style={[
        styles.chip,
        {
          minHeight: height,
          paddingHorizontal: unit ? t.spacing.md : 14,
          borderRadius: unit ? t.radius.input : t.radius.pill,
          backgroundColor: bg,
          borderColor: selected ? c.primary : unit ? c.surface2 : c.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text variant={unit ? 'button' : 'caption'} weight={selected ? '600' : '500'} color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
});
