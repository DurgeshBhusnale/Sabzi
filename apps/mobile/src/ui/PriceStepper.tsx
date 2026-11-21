import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { LIMITS, PRICE_UNITS, UNIT_LABELS, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Chip } from './Chip';
import { Text } from './Text';
import { TextInput } from './TextInput';
import { en } from '../i18n/en';

/** Rows visible in the wheel: one above, the selected price, one below. */
const VISIBLE = 3;
/** Rows drawn on each side of the current one (the wheel has 1,000 rows; only these are rendered). */
const WINDOW = 15;

export function clampPrice(price: number): number {
  return Math.max(0, Math.min(LIMITS.priceMax, Math.round(price)));
}

export function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price >= LIMITS.priceMin && price <= LIMITS.priceMax;
}

/** Wheel row under the centre line for a scroll offset. */
export function wheelIndex(offsetY: number, row: number): number {
  return clampPrice(offsetY / row);
}

/**
 * Owner review 2026-11-21: a time-picker style wheel of rupee prices (₹0–₹999). Scroll to change; it snaps to
 * whole rupees. Tapping the selected price calls `onPressValue` (the stepper switches to the number keypad).
 */
export function PriceWheel({
  value,
  onChange,
  onPressValue,
  invalid,
  a11yLabel,
  testID = 'price-wheel',
}: {
  value: number;
  onChange: (p: number) => void;
  onPressValue?: () => void;
  invalid?: boolean;
  a11yLabel: string;
  testID?: string;
}) {
  const t = useTheme();
  const row = t.layout.priceWheelRow;
  const pad = (row * (VISIBLE - 1)) / 2;
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  // Row under the centre line while the wheel moves; null when it rests on `value`.
  const [moving, setMoving] = useState<number | null>(null);
  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = moving ?? clampPrice(value);

  // Typed prices (and other outside changes) move the wheel; never while the vendor is scrolling it.
  useEffect(() => {
    if (moving === null) ref.current?.scrollTo({ y: clampPrice(value) * row, animated: false });
  }, [value, moving, row]);
  useEffect(() => () => {
    if (dragTimer.current) clearTimeout(dragTimer.current);
  }, []);

  const stopTimer = () => {
    if (dragTimer.current) clearTimeout(dragTimer.current);
    dragTimer.current = null;
  };
  const commit = (y: number) => {
    stopTimer();
    const idx = wheelIndex(y, row);
    setMoving(null);
    if (idx !== value) onChange(idx);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = wheelIndex(e.nativeEvent.contentOffset.y, row);
    if (idx !== moving) setMoving(idx);
  };

  const from = Math.max(0, shown - WINDOW);
  const to = Math.min(LIMITS.priceMax, shown + WINDOW);
  const rows: number[] = [];
  for (let i = from; i <= to; i++) rows.push(i);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={a11yLabel}
      accessibilityValue={{ text: `₹${value}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(clampPrice(value + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(clampPrice(value - 1));
        if (e.nativeEvent.actionName === 'activate') onPressValue?.();
      }}
      style={{ height: row * VISIBLE, alignSelf: 'stretch' }}
    >
      {/* the selection band, like a time picker */}
      <View
        pointerEvents="none"
        style={[
          styles.band,
          { top: pad, height: row, borderColor: invalid ? t.colors.error : t.colors.primary, backgroundColor: t.colors.primaryTint, borderRadius: t.radius.card },
        ]}
      />
      <ScrollView
        ref={ref}
        testID={`${testID}-scroll`}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={row}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: clampPrice(value) * row }}
        scrollEventThrottle={32}
        onScroll={onScroll}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={(e) => {
          // Some drags end without a fling; commit if no momentum follows.
          const y = e.nativeEvent.contentOffset.y;
          stopTimer();
          dragTimer.current = setTimeout(() => commit(y), 250);
        }}
        onMomentumScrollBegin={stopTimer}
        onMomentumScrollEnd={(e) => commit(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ height: (LIMITS.priceMax + 1) * row + pad * 2 }}
      >
        {rows.map((i) => {
          const selected = i === shown;
          return (
            <Pressable
              key={i}
              testID={selected ? `${testID}-selected` : `${testID}-row-${i}`}
              onPress={() => (selected ? onPressValue?.() : onChange(i))}
              style={[styles.row, { top: pad + i * row, height: row }]}
            >
              <Text
                variant={selected ? 'numberLarge' : 'h1'}
                color={selected ? (invalid ? 'error' : 'textPrimary') : 'textMuted'}
                testID={selected ? 'price-value' : undefined}
              >
                {`₹${i}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Vendor price editor: price wheel (tap the price to type), unit chips, "was ₹35" hint, invalid state. */
export function PriceStepper({
  price,
  unit,
  wasPrice,
  onChange,
  onUnitChange,
  testID = 'price-stepper',
}: {
  price: number;
  unit: PriceUnit;
  wasPrice?: number | null;
  onChange: (p: number) => void;
  onUnitChange?: (u: PriceUnit) => void;
  testID?: string;
}) {
  const t = useTheme();
  const [typing, setTyping] = useState(false);
  const invalid = !isValidPrice(price);
  return (
    <View style={{ gap: t.spacing.sm }} testID={testID}>
      {typing ? (
        <TextInput
          kind="price"
          label={en.vendor.perUnit(UNIT_LABELS[unit])}
          value={price ? String(price) : ''}
          onChangeText={(v) => onChange(clampPrice(Number(v.replace(/\D/g, '')) || 0))}
          onBlur={() => setTyping(false)}
          onSubmitEditing={() => setTyping(false)}
          returnKeyType="done"
          maxChars={3}
          autoFocus
          testID="price-typing"
        />
      ) : (
        <PriceWheel
          value={price}
          onChange={onChange}
          onPressValue={() => setTyping(true)}
          invalid={invalid}
          a11yLabel={en.menu.priceA11y(price, UNIT_LABELS[unit])}
          testID={`${testID}-wheel`}
        />
      )}
      <View style={[styles.line, { gap: t.spacing.xs }]}>
        <Text color="textSecondary">{`per ${UNIT_LABELS[unit]}`}</Text>
        {wasPrice != null && wasPrice !== price && !invalid ? (
          <View style={{ backgroundColor: t.colors.dealAmberTint, borderRadius: t.radius.chip, paddingHorizontal: t.spacing.xs }}>
            <Text color="dealAmberText" testID="was-hint">{en.menu.was(wasPrice)}</Text>
          </View>
        ) : null}
      </View>
      {invalid ? (
        <Text variant="bodySmall" color="error" align="center" accessibilityLiveRegion="polite">{en.menu.priceInvalid}</Text>
      ) : (
        <Text variant="caption" weight="400" color="textMuted" align="center">{en.menu.wheelHint}</Text>
      )}
      {onUnitChange ? (
        <View style={[styles.line, styles.wrap, { gap: t.spacing.xs }]}>
          {PRICE_UNITS.map((u) => (
            <Chip key={u} kind="unit" label={UNIT_LABELS[u]} selected={u === unit} onPress={() => onUnitChange(u)} testID={`unit-${u}`} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, borderTopWidth: 2, borderBottomWidth: 2 },
  row: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  wrap: { flexWrap: 'wrap' },
});
