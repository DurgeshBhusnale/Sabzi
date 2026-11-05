import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export function SegmentedControl<T extends string>({ options, value, onChange, testID = 'segmented' }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} accessibilityRole="tablist" style={[styles.row, { backgroundColor: t.colors.surface2, borderRadius: t.radius.card, padding: t.spacing.xxs }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={`${testID}-${o.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.seg, { minHeight: t.layout.minTouch - 4, borderRadius: t.radius.input, backgroundColor: selected ? t.colors.surface : 'transparent' }]}
          >
            <Text variant="bodySmall" weight={selected ? '600' : '500'} color={selected ? 'textPrimary' : 'textSecondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row' }, seg: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
