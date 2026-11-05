import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** Screen frame: background, safe area, optional scroll + pull to refresh, 16 dp side padding. */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  refreshing,
  onRefresh,
  padded = true,
  contentStyle,
  testID,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const pad = padded ? { padding: t.spacing.screen, gap: t.spacing.md } : null;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.bg }} testID={testID}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, { paddingBottom: t.spacing.huge * 2 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[t.colors.primary]} tintColor={t.colors.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={{ padding: t.spacing.screen, backgroundColor: t.colors.bg, borderTopWidth: 1, borderTopColor: t.colors.border }}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Section({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="h2" accessibilityRole="header">{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}
