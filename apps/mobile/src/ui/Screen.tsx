import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { ForestHero, SectionHeader, SheetBody } from './Layout';

/**
 * Screen frame: background, safe area, optional scroll + pull to refresh, 24 dp side gutter.
 * `tone="forest"` is the v4 header screen: forest band (`hero`) above a cream body sheet.
 */
export function Screen({
  children,
  header,
  hero,
  footer,
  tone = 'default',
  scroll = true,
  refreshing,
  onRefresh,
  padded = true,
  contentStyle,
  testID,
}: {
  children: ReactNode;
  header?: ReactNode;
  hero?: ReactNode;
  footer?: ReactNode;
  tone?: 'default' | 'forest';
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const forest = tone === 'forest';
  const pad = padded ? { paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.xxs, gap: t.spacing.md } : null;
  const refresh = onRefresh ? (
    <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[t.colors.primary]} tintColor={forest ? t.colors.onForest : t.colors.primary} progressBackgroundColor={t.colors.surface} />
  ) : undefined;

  const body = forest ? (
    <>
      {hero ? <ForestHero>{hero}</ForestHero> : null}
      {/* Without `hero`, children bring their own ForestHero + SheetBody */}
      {hero ? <SheetBody style={[!padded ? { paddingHorizontal: 0 } : null, contentStyle]}>{children}</SheetBody> : children}
    </>
  ) : (
    children
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: forest ? t.colors.forest : t.colors.bg }} testID={testID}>
      <StatusBar style={forest || t.scheme === 'dark' ? 'light' : 'dark'} />
      {header}
      {scroll ? (
        <ScrollView
          style={forest ? { backgroundColor: t.colors.forest } : null}
          contentContainerStyle={forest ? { flexGrow: 1 } : [pad, { paddingBottom: t.spacing.huge * 2 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refresh}
        >
          {body}
        </ScrollView>
      ) : forest ? (
        <View style={{ flex: 1 }}>{body}</View>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.sm, paddingBottom: t.spacing.md, backgroundColor: t.colors.bg, borderTopWidth: 1, borderTopColor: t.colors.border, gap: t.spacing.xs }}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/** Titled group: v4 italic Newsreader heading with an optional right caption/node. */
export function Section({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      {title ? (
        typeof right === 'string' || right == null ? (
          <SectionHeader title={title} right={right as string | undefined} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionHeader title={title} />
            {right}
          </View>
        )
      ) : null}
      {children}
    </View>
  );
}
