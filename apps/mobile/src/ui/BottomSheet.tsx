import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/** 20 dp top radius, drag handle, max 85% height; closes on scrim tap or back. */
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
            backgroundColor: t.colors.surface,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            paddingHorizontal: t.spacing.md,
            paddingBottom: t.spacing.xl,
            shadowColor: t.colors.shadow,
            shadowOpacity: t.elevation.raised.shadowOpacity,
            shadowRadius: t.elevation.raised.shadowRadius,
            elevation: t.elevation.raised.elevation,
          }}
        >
          <View style={[styles.handle, { backgroundColor: t.colors.border, marginVertical: t.spacing.xs }]} />
          {title ? (
            <Text variant="h2" accessibilityRole="header" style={{ marginBottom: t.spacing.sm }}>
              {title}
            </Text>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: t.spacing.sm }}>
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
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
});
