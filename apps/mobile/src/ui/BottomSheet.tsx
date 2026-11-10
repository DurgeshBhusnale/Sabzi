import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** v4 sheet: cream ground, 28 dp top radius, drag handle, max 85% height; closes on scrim tap or back. */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  testID = 'bottom-sheet',
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
}) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable accessibilityLabel="Close" accessibilityRole="button" style={[styles.fill, { backgroundColor: t.colors.scrim }]} onPress={onClose} />
        <View
          testID={testID}
          accessibilityViewIsModal
          style={{
            maxHeight: height * t.layout.bottomSheetMaxHeightRatio,
            backgroundColor: t.colors.bg,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            paddingHorizontal: t.spacing.screen,
            paddingBottom: t.spacing.xxl,
            shadowColor: t.colors.shadow,
            shadowOpacity: t.elevation.raised.shadowOpacity,
            shadowRadius: t.elevation.raised.shadowRadius,
            elevation: t.elevation.raised.elevation,
          }}
        >
          <View style={[styles.handle, { backgroundColor: t.colors.border, marginTop: t.spacing.sm, marginBottom: t.spacing.md }]} />
          {title ? (
            <Text variant="h1" accessibilityRole="header" style={{ marginBottom: t.spacing.md, fontSize: t.type.h1.fontSize - 4, lineHeight: t.type.h1.lineHeight - 4 }}>
              {title}
            </Text>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: t.spacing.md }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ marginTop: t.spacing.md }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
});
