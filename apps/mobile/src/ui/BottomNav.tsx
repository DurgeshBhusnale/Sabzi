import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';

export type NavItem = { key: string; label: string; icon: LucideIcon; badge?: number };

/** 64 dp, 4 tabs max, labels always visible, filled icon + tint pill for the selected tab. */
export function BottomNav({ items, selected, onSelect }: { items: NavItem[]; selected: string; onSelect: (key: string) => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="bottom-nav"
      accessibilityRole="tablist"
      style={[styles.bar, { minHeight: t.layout.bottomNav + insets.bottom, paddingBottom: insets.bottom, backgroundColor: t.colors.surface, borderTopColor: t.colors.border }]}
    >
      {items.map((it) => {
        const on = it.key === selected;
        return (
          <Pressable
            key={it.key}
            testID={`tab-${it.key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={it.badge ? `${it.label}, ${it.badge} new` : it.label}
            onPress={() => onSelect(it.key)}
            style={[styles.tab, { minHeight: t.layout.bottomNav, gap: t.spacing.xxs }]}
          >
            <View style={{ backgroundColor: on ? t.colors.primaryTint : 'transparent', borderRadius: t.radius.pill, paddingHorizontal: t.spacing.md, paddingVertical: 2 }}>
              <Icon icon={it.icon} color={on ? 'primary' : 'textSecondary'} filled={on} />
              {it.badge ? (
                <View style={[styles.badge, { backgroundColor: t.colors.error, borderRadius: t.radius.pill }]}>
                  <Text variant="caption" weight="700" color="onError">{String(it.badge)}</Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" weight={on ? '700' : '500'} color={on ? 'primary' : 'textSecondary'}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, right: 4, minWidth: 18, paddingHorizontal: 4, alignItems: 'center' },
});
