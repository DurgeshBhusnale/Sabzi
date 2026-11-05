import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Icon, type LucideIcon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'default' | 'xl' | 'fab';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Shows a check and this label (e.g. "Following") for 1 s after success */
  successLabel?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  successLabel,
  icon,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const t = useTheme();
  const c = t.colors;
  const height = size === 'fab' ? t.heights.fab : size === 'xl' ? t.heights.vendorXL : t.heights.buyer;
  const inactive = disabled || loading;

  const palette = (pressed: boolean) => {
    if (disabled) {
      if (variant === 'secondary') return { bg: c.surface, fg: c.textMuted, border: c.border };
      if (variant === 'tertiary') return { bg: 'transparent', fg: c.textMuted, border: 'transparent' };
      return { bg: c.disabled, fg: c.onDisabled, border: c.disabled };
    }
    switch (variant) {
      case 'secondary':
        return { bg: pressed ? c.primaryTint : c.surface, fg: c.primary, border: c.primary };
      case 'tertiary':
        return { bg: pressed ? c.primaryTint : 'transparent', fg: c.primary, border: 'transparent' };
      case 'destructive':
        return { bg: pressed ? c.textPrimary : c.error, fg: c.onError, border: pressed ? c.textPrimary : c.error };
      default:
        return { bg: pressed ? c.primaryPressed : c.primary, fg: c.onPrimary, border: pressed ? c.primaryPressed : c.primary };
    }
  };

  const fgKey = (() => {
    if (disabled) return variant === 'primary' || variant === 'destructive' ? 'onDisabled' : 'textMuted';
    if (variant === 'secondary' || variant === 'tertiary') return 'primary';
    return variant === 'destructive' ? 'onError' : 'onPrimary';
  })() as 'onDisabled' | 'textMuted' | 'primary' | 'onError' | 'onPrimary';

  const shown = successLabel ?? label;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={height < t.layout.minTouch ? (t.layout.minTouch - height) / 2 : undefined}
      style={({ pressed }) => {
        const p = palette(pressed);
        return [
          styles.base,
          {
            minHeight: height,
            minWidth: t.layout.minTouch,
            borderRadius: size === 'fab' ? t.radius.pill : t.radius.card,
            backgroundColor: p.bg,
            borderColor: p.border,
            paddingHorizontal: size === 'fab' ? t.spacing.xxl : t.spacing.md,
            alignSelf: fullWidth && size !== 'fab' ? 'stretch' : 'center',
          },
          size === 'fab' && !disabled
            ? {
                shadowColor: c.shadow,
                shadowOpacity: t.elevation.raised.shadowOpacity,
                shadowRadius: t.elevation.raised.shadowRadius,
                shadowOffset: { width: 0, height: t.elevation.raised.shadowOffsetY },
                elevation: t.elevation.raised.elevation,
              }
            : null,
          style,
        ];
      }}
    >
      <View style={[styles.row, { gap: t.spacing.xs }]}>
        {loading ? <ActivityIndicator testID={testID ? `${testID}-spinner` : 'button-spinner'} color={c[fgKey]} /> : null}
        {!loading && successLabel ? <Icon icon={Check} color={fgKey} /> : null}
        {!loading && !successLabel && icon ? <Icon icon={icon} color={fgKey} /> : null}
        <Text variant="button" color={fgKey} style={size !== 'default' ? { fontSize: t.type.button.fontSize + 2 } : null}>
          {shown}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
