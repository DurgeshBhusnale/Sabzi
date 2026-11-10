import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Icon, type LucideIcon } from './Icon';

/** v4: primary forest, secondary outline, tertiary link, destructive red outline, accent green ("I've arrived"), light cream on forest, outlineOnDark */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'accent' | 'light' | 'outlineOnDark';
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

  type Fg = 'onDisabled' | 'textMuted' | 'primary' | 'error' | 'onPrimary' | 'accent' | 'onAccent' | 'onCream' | 'onForest';
  const palette = (pressed: boolean): { bg: string; border: string } => {
    if (disabled) {
      if (variant === 'tertiary' || variant === 'outlineOnDark') return { bg: 'transparent', border: 'transparent' };
      return { bg: c.disabled, border: c.disabled };
    }
    switch (variant) {
      case 'secondary':
        return { bg: pressed ? c.primaryTint : 'transparent', border: c.primary };
      case 'tertiary':
        return { bg: pressed ? c.primaryTint : 'transparent', border: 'transparent' };
      case 'destructive':
        return { bg: pressed ? c.errorTint : 'transparent', border: c.error };
      case 'accent':
        return { bg: pressed ? c.primaryPressed : c.accent, border: pressed ? c.primaryPressed : c.accent };
      case 'light':
        return { bg: pressed ? c.surface2 : c.cream, border: pressed ? c.surface2 : c.cream };
      case 'outlineOnDark':
        return { bg: pressed ? c.forestRaised : 'transparent', border: 'rgba(255,255,255,0.4)' };
      default:
        return { bg: pressed ? c.primaryPressed : c.primary, border: pressed ? c.primaryPressed : c.primary };
    }
  };

  const fgKey: Fg = (() => {
    if (disabled) return variant === 'tertiary' || variant === 'outlineOnDark' ? 'textMuted' : 'onDisabled';
    switch (variant) {
      case 'secondary':
        return 'primary';
      case 'tertiary':
        return 'accent';
      case 'destructive':
        return 'error';
      case 'accent':
        return 'onAccent';
      case 'light':
        return 'onCream';
      case 'outlineOnDark':
        return 'onForest';
      default:
        return 'onPrimary';
    }
  })();

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
            borderRadius: size === 'fab' ? t.radius.pill : t.radius.button,
            backgroundColor: p.bg,
            borderColor: p.border,
            paddingHorizontal: size === 'fab' ? t.spacing.xxl : t.spacing.md,
            alignSelf: fullWidth && size !== 'fab' ? 'stretch' : 'center',
          },
          size === 'fab' && !disabled
            ? {
                shadowColor: c.forest,
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
        {!loading && successLabel ? <Icon icon={Check} size={18} color={fgKey} /> : null}
        {!loading && !successLabel && icon ? <Icon icon={icon} size={18} color={fgKey} /> : null}
        <Text variant="button" color={fgKey} style={size === 'fab' ? { fontSize: t.type.button.fontSize + 1 } : null}>
          {shown}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
