import { KeyboardAvoidingView, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, type ReactNode } from 'react';
import { useKeyboardVisible } from './useKeyboardVisible';
import { useTheme } from '../theme/ThemeProvider';
import { ForestHero, SheetBody } from './Layout';

/**
 * False inside the tab layouts: their tab bar already sits above the Android navigation bar,
 * so a screen there must not add the bottom inset again.
 */
export const BottomInsetContext = createContext(true);

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
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  // Edge-to-edge Android draws under the system navigation bar: keep bottom buttons and the last
  // scroll row above it (owner review 2026-11-21). With the keyboard open the inset is not needed.
  const bottomInset = useContext(BottomInsetContext) && !keyboard ? insets.bottom : 0;
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
      {/* Edge-to-edge Android no longer resizes the window for the keyboard: pad it ourselves so the
          focused input and the footer stay visible above the keyboard (owner review 2026-11-21). */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {scroll ? (
        <ScrollView
          style={forest ? { backgroundColor: t.colors.forest } : null}
          contentContainerStyle={forest ? { flexGrow: 1, paddingBottom: footer ? 0 : bottomInset } : [pad, { paddingBottom: t.spacing.huge * 2 + (footer ? 0 : bottomInset) }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refresh}
        >
          {body}
        </ScrollView>
      ) : forest ? (
        <View style={{ flex: 1 }}>{body}</View>
      ) : (
        <View style={[{ flex: 1 }, pad, { paddingBottom: footer ? 0 : bottomInset }, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View testID="screen-footer" style={{ paddingHorizontal: t.spacing.screen, paddingTop: t.spacing.sm, paddingBottom: t.spacing.md + bottomInset, backgroundColor: t.colors.bg, borderTopWidth: 1, borderTopColor: t.colors.border, gap: t.spacing.xs }}>
          {footer}
        </View>
      ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

