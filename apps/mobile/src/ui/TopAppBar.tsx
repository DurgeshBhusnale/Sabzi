import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft, ChevronDown, Bell, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type LucideIcon } from './Icon';
import { IconCircleButton } from './Layout';
import { Text } from './Text';
import { en } from '../i18n/en';

export type AppBarAction = { icon: LucideIcon; label: string; onPress: () => void; badge?: boolean };

/**
 * v4 top bar: 44 dp row with a round back button on the left and actions on the right,
 * then the page title as a large Newsreader heading. `tone="forest"` for header screens.
 * The society variant (buyer home) shows a map pin, the society and a caret.
 */
export function TopAppBar({
  title,
  subtitle,
  onBack,
  actions = [],
  scrolled = false,
  society,
  onSocietyPress,
  onBellPress,
  unread = false,
  right,
  tone = 'default',
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: AppBarAction[];
  scrolled?: boolean;
  society?: string;
  onSocietyPress?: () => void;
  onBellPress?: () => void;
  unread?: boolean;
  right?: ReactNode;
  tone?: 'default' | 'forest';
  /** Title inline in the bar instead of the large heading below it */
  compact?: boolean;
}) {
  const t = useTheme();
  const onDark = tone === 'forest';
  const fg = onDark ? 'onForest' : 'textPrimary';
  const btn = { minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, alignItems: 'center' as const, justifyContent: 'center' as const };
  const allActions: AppBarAction[] = onBellPress ? [...actions, { icon: Bell, label: en.nav.notifications, onPress: onBellPress, badge: unread }] : actions;
  const largeTitle = !!title && !society && !compact;
  return (
    <View
      testID={scrolled ? 'app-bar-scrolled' : 'app-bar'}
      style={{
        backgroundColor: onDark ? t.colors.forest : t.colors.bg,
        paddingHorizontal: t.spacing.screen,
        paddingBottom: largeTitle ? t.spacing.sm : 0,
        borderBottomWidth: scrolled ? 1 : 0,
        borderBottomColor: t.colors.border,
      }}
    >
      <View style={[styles.bar, { minHeight: t.layout.topAppBar, gap: t.spacing.xs }]}>
        {onBack ? <IconCircleButton icon={ArrowLeft} label={en.nav.back} onPress={onBack} onDark={onDark} testID="app-bar-back" /> : null}
        {society ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={en.nav.switchSociety(society)}
            onPress={onSocietyPress}
            style={[styles.row, styles.flex, { minHeight: t.layout.minTouch, gap: 6 }]}
            testID="society-switcher"
          >
            <Icon icon={MapPin} size={16} color={fg} />
            <Text variant="label" color={fg} numberOfLines={1} style={{ flexShrink: 1 }}>{society}</Text>
            <Icon icon={ChevronDown} size={16} color={fg} />
          </Pressable>
        ) : compact && title ? (
          <Text variant="label" color={fg} accessibilityRole="header" numberOfLines={1} style={[styles.flex, { marginLeft: onBack ? t.spacing.xxs : 0 }]}>
            {title}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {right}
        {allActions.map((a) => (
          <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress} style={btn}>
            <Icon icon={a.icon} size={22} color={fg} />
            {a.badge ? <View testID="unread-dot" style={[styles.dot, { backgroundColor: onDark ? t.colors.mint : t.colors.error }]} /> : null}
          </Pressable>
        ))}
      </View>
      {largeTitle ? (
        <View style={{ gap: t.spacing.xs }}>
          <Text variant="h1" color={fg} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text variant="bodySmall" color={onDark ? 'onForestMuted' : 'textSecondary'}>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  dot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4 },
});
