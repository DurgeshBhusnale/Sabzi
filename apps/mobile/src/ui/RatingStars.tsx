import { Pressable, StyleSheet, View } from 'react-native';
import { Star, StarHalf } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from './Icon';
import { Text } from './Text';
import { en } from '../i18n/en';

/** Display (small, half stars) */
export function RatingDisplay({ value, count, size = 16 }: { value: number; count?: number; size?: number }) {
  const t = useTheme();
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <View style={[styles.row, { gap: t.spacing.xxs }]} accessible accessibilityLabel={en.rating.a11y(value, count)}>
      <View style={styles.row}>
        {Array.from({ length: 5 }).map((_, i) =>
          i < full ? (
            <Icon key={i} icon={Star} size={size} color="dealAmber" filled />
          ) : i === full && half ? (
            <Icon key={i} icon={StarHalf} size={size} color="dealAmber" filled />
          ) : (
            <Icon key={i} icon={Star} size={size} color="disabled" />
          ),
        )}
      </View>
      <Text variant="bodySmall" weight="700">{value.toFixed(1)}</Text>
      {count != null ? <Text variant="bodySmall" color="textSecondary">{en.rating.count(count)}</Text> : null}
    </View>
  );
}

/** Input (large, 40 dp stars) */
export function RatingInput({ value, onChange, disabled = false }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs, alignItems: 'center' }}>
      <View style={[styles.row, { gap: t.spacing.xs }]} accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 5, now: value }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Pressable
            key={i}
            testID={`star-${i + 1}`}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={en.rating.starLabel(i + 1)}
            accessibilityState={{ selected: i < value, disabled }}
            onPress={() => onChange(i + 1)}
            style={{ minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon icon={Star} size={t.layout.starInputSize} color={disabled ? 'disabled' : i < value ? 'dealAmber' : 'disabled'} filled={!disabled && i < value} />
          </Pressable>
        ))}
      </View>
      {value > 0 && !disabled ? <Text color="textSecondary">{en.rating.words[value - 1]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
