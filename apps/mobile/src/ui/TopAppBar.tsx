import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft, ChevronDown, Bell } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';
import { en } from '../i18n/en';

export type AppBarAction = { icon: LucideIcon; label: string; onPress: () => void; badge?: boolean };

/** 56 dp; title left-aligned; back arrow on inner screens; society switcher variant. */
export function TopAppBar({
  title,
  onBack,
  actions = [],
  scrolled = false,
  society,
  onSocietyPress,
  onBellPress,
  unread = false,
  right,
}: {
  title?: string;
  onBack?: () => void;
  actions?: AppBarAction[];
  scrolled?: boolean;
  society?: string;
  onSocietyPress?: () => void;
  onBellPress?: () => void;
  unread?: boolean;
  right?: ReactNode;
}) {
  const t = useTheme();
  const btn = { minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, alignItems: 'center' as const, justifyContent: 'center' as const };
  const allActions: AppBarAction[] = onBellPress ? [...actions, { icon: Bell, label: en.nav.notifications, onPress: onBellPress, badge: unread }] : actions;
  return (
    <View
      testID={scrolled ? 'app-bar-scrolled' : 'app-bar'}
      style={[
        styles.bar,
        {
          minHeight: t.layout.topAppBar,
          paddingHorizontal: onBack ? t.spacing.xxs : t.spacing.md,
          backgroundColor: t.colors.surface,
          borderBottomWidth: scrolled ? 1 : 0,
          borderBottomColor: t.colors.border,
        },
      ]}
    >
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel={en.nav.back} onPress={onBack} style={btn} testID="app-bar-back">
          <Icon icon={ArrowLeft} />
        </Pressable>
      ) : null}
      {society ? (
        <Pressable accessibilityRole="button" accessibilityLabel={en.nav.switchSociety(society)} onPress={onSocietyPress} style={[styles.flex, { minHeight: t.layout.minTouch, justifyContent: 'center' }]} testID="society-switcher">
          <Text variant="caption" color="textSecondary">{en.nav.yourSociety}</Text>
          <View style={[styles.row, { gap: t.spacing.xxs }]}>
            <Text variant="h2" numberOfLines={1}>{society}</Text>
            <Icon icon={ChevronDown} size={20} />
          </View>
        </Pressable>
      ) : (
        <Text variant="h2" accessibilityRole="header" numberOfLines={1} style={[styles.flex, onBack ? { marginLeft: t.spacing.xxs } : null]}>
          {title ?? ''}
        </Text>
      )}
      {right}
      {allActions.map((a) => (
        <Pressable key={a.label} accessibilityRole="button" accessibilityLabel={a.label} onPress={a.onPress} style={btn}>
          <Icon icon={a.icon} />
          {a.badge ? <View testID="unread-dot" style={[styles.dot, { backgroundColor: t.colors.error }]} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  dot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4 },
});
