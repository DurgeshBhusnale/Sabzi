import { Pressable, StyleSheet, View } from 'react-native';
import { LIMITS, PRICE_UNITS, UNIT_LABELS, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Chip } from './Chip';
import { Text } from './Text';
import { en } from '../i18n/en';

export const STEPS = [-5, -1, 1, 5] as const;

export function stepPrice(price: number, delta: number): number {
  return Math.max(0, Math.min(LIMITS.priceMax + 1, price + delta));
}

export function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price >= LIMITS.priceMin && price <= LIMITS.priceMax;
}

/** Vendor price editor: big number, −5 −1 +1 +5, unit chips, "was ₹35" hint, invalid state. */
export function PriceStepper({
  price,
  unit,
  wasPrice,
  onChange,
  onUnitChange,
  onEditNumber,
}: {
  price: number;
  unit: PriceUnit;
  wasPrice?: number | null;
  onChange: (p: number) => void;
  onUnitChange?: (u: PriceUnit) => void;
  onEditNumber?: () => void;
}) {
  const t = useTheme();
  const invalid = !isValidPrice(price);
  return (
    <View style={{ gap: t.spacing.md }} testID="price-stepper">
      <Pressable onPress={onEditNumber} accessibilityRole="button" accessibilityLabel={`Price ₹${price} per ${UNIT_LABELS[unit]}. Tap to type`} style={styles.center}>
        <Text variant="display" color={invalid ? 'error' : 'textPrimary'} style={{ fontSize: t.type.display.fontSize * 1.6, lineHeight: t.type.display.lineHeight * 1.6 }} testID="price-value">
          {`₹${price}`}
        </Text>
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          <Text color="textSecondary">{`per ${UNIT_LABELS[unit]}`}</Text>
          {wasPrice != null && wasPrice !== price && !invalid ? (
            <View style={{ backgroundColor: t.colors.dealAmberTint, borderRadius: t.radius.chip, paddingHorizontal: t.spacing.xs }}>
              <Text color="dealAmberText" testID="was-hint">{en.menu.was(wasPrice)}</Text>
            </View>
          ) : null}
        </View>
        {invalid ? (
          <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">{en.menu.priceInvalid}</Text>
        ) : null}
      </Pressable>
      <View style={[styles.row, { gap: t.spacing.xs }]}>
        {STEPS.map((d) => (
          <Pressable
            key={d}
            testID={`step-${d}`}
            accessibilityRole="button"
            accessibilityLabel={d > 0 ? `Add ${d} rupees` : `Subtract ${-d} rupees`}
            onPress={() => onChange(stepPrice(price, d))}
            style={({ pressed }) => [
              styles.step,
              { minHeight: t.heights.vendorXL, borderRadius: t.radius.card, backgroundColor: pressed ? t.colors.primaryTint : t.colors.surface2 },
            ]}
          >
            <Text variant="button" weight="700">{d > 0 ? `+${d}` : `−${-d}`}</Text>
          </Pressable>
        ))}
      </View>
      {onUnitChange ? (
        <View style={[styles.row, styles.wrap, { gap: t.spacing.xs }]}>
          {PRICE_UNITS.map((u) => (
            <Chip key={u} kind="unit" label={UNIT_LABELS[u]} selected={u === unit} onPress={() => onUnitChange(u)} testID={`unit-${u}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  step: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
