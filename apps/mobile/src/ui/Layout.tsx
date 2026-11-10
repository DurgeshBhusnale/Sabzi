import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';

/**
 * v4 forest header band: white text on deep green, sits above the cream body sheet.
 * Use inside <Screen tone="forest">.
 */
export function ForestHero({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={[{ backgroundColor: t.colors.forest, paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.xxs, paddingBottom: t.spacing.xl, gap: 14 }, style]}>
      {children}
    </View>
  );
}

/** Cream body with rounded top corners that slides over the forest band. */
export function SheetBody({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const t = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          flexGrow: 1,
          backgroundColor: t.colors.bg,
          borderTopLeftRadius: t.layout.headerSheetRadius,
          borderTopRightRadius: t.layout.headerSheetRadius,
          paddingHorizontal: t.spacing.screen,
          paddingTop: t.spacing.xl,
          paddingBottom: t.spacing.huge * 2,
          gap: t.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function LiveDot({ color }: { color: string }) {
  const t = useTheme();
  const [o] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.4, duration: t.motion.pulseMs / 2, useNativeDriver: true }),
        Animated.timing(o, { toValue: 1, duration: t.motion.pulseMs / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o, t.motion.pulseMs]);
  return <Animated.View testID="live-dot" style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: o }} />;
}

/** Small uppercase label above a title; `live` adds the pulsing dot; `onDark` uses mint. */
export function Eyebrow({ children, live = false, onDark = false, testID }: { children: string; live?: boolean; onDark?: boolean; testID?: string }) {
  const t = useTheme();
  const color = onDark ? t.colors.mint : t.colors.accent;
  return (
    <View testID={testID} style={[styles.row, { gap: t.spacing.xs }]}>
      {live ? <LiveDot color={color} /> : null}
      <Text variant="eyebrow" style={{ color }}>{children}</Text>
    </View>
  );
}

/** Italic Newsreader section title with an optional caption or link on the right. */
export function SectionHeader({ title, right, onRightPress, testID }: { title: string; right?: string; onRightPress?: () => void; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={[styles.row, { justifyContent: 'space-between', alignItems: 'baseline', gap: t.spacing.sm }]}>
      <Text variant="h2" accessibilityRole="header" style={styles.flex}>{title}</Text>
      {right ? (
        onRightPress ? (
          <Pressable accessibilityRole="button" onPress={onRightPress} hitSlop={12}>
            <Text variant="caption" color="accent">{right}</Text>
          </Pressable>
        ) : (
          <Text variant="caption" color="textSecondary">{right}</Text>
        )
      ) : null}
    </View>
  );
}

/** v4 list row: hairline divider, left art, title + subtitle, right node, optional chevron. */
export function ListRow({
  title,
  subtitle,
  left,
  right,
  chevron = false,
  last = false,
  onPress,
  muted = false,
  subtitleColor = 'textSecondary',
  minHeight,
  testID,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  chevron?: boolean;
  last?: boolean;
  onPress?: () => void;
  muted?: boolean;
  subtitleColor?: 'textSecondary' | 'error' | 'accent' | 'dealAmberText' | 'textMuted';
  minHeight?: number;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const body = (
    <>
      {left}
      <View style={styles.flex}>
        <Text variant="label" color={muted ? 'textSecondary' : 'textPrimary'}>{title}</Text>
        {subtitle ? <Text variant="caption" weight="400" color={subtitleColor}>{subtitle}</Text> : null}
      </View>
      {right}
      {chevron ? <Icon icon={ChevronRight} size={16} color="textSecondary" /> : null}
    </>
  );
  const style = [
    styles.row,
    {
      minHeight: minHeight ?? t.layout.listRowWithImage,
      gap: t.spacing.sm,
      borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth * 2,
      borderBottomColor: t.colors.border,
      opacity: muted ? 0.6 : 1,
    },
  ];
  if (onPress) {
    return (
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)} onPress={onPress} style={({ pressed }) => [style, pressed ? { opacity: 0.7 } : null]}>
        {body}
      </Pressable>
    );
  }
  return (
    <View testID={testID} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={style}>
      {body}
    </View>
  );
}

/** Round 36 dp icon button with a 48 dp hit area (back, close, overflow). */
export function IconCircleButton({
  icon,
  label,
  onPress,
  onDark = false,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  onDark?: boolean;
  testID?: string;
}) {
  const t = useTheme();
  const size = t.heights.iconButton;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={(t.layout.minTouch - size) / 2}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: onDark ? 'rgba(255,255,255,0.3)' : t.colors.border,
        backgroundColor: onDark ? 'transparent' : t.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon icon={icon} size={18} color={onDark ? 'onForest' : 'textPrimary'} />
    </Pressable>
  );
}

/** "₹40 /kg" in Newsreader with a small Figtree unit. */
export function PriceText({ amount, unit, onDark = false, strike = false, color }: { amount: string; unit?: string; onDark?: boolean; strike?: boolean; color?: 'textPrimary' | 'textMuted' | 'dealAmberText' | 'onForest' }) {
  const c = color ?? (onDark ? 'onForest' : 'textPrimary');
  return (
    <Text variant="price" color={c} strike={strike}>
      {amount}
      {unit ? (
        <Text variant="caption" weight="400" color={onDark ? 'onForest' : 'textSecondary'} style={onDark ? { opacity: 0.7 } : null}>{` /${unit}`}</Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1, minWidth: 0 } });
