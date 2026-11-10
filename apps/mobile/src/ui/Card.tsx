import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ReactNode } from 'react';

/** v4 card: white, 14 dp radius, hairline border, 16 dp padding. */
export function Card({
  children,
  onPress,
  tint,
  style,
  testID,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  tint?: 'primary' | 'amber' | 'error' | 'muted';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  const bg = tint === 'primary' ? c.primaryTint : tint === 'amber' ? c.dealAmberTint : tint === 'error' ? c.errorTint : tint === 'muted' ? c.surface2 : c.surface;
  const base: ViewStyle = {
    backgroundColor: bg,
    borderWidth: t.layout.cardBorderWidth,
    borderColor: c.border,
    borderRadius: t.radius.card,
    padding: t.spacing.md,
  };
  if (onPress) {
    return (
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [base, pressed ? { backgroundColor: c.surface2 } : null, style]}>
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[base, style]}>
      {children}
    </View>
  );
}
