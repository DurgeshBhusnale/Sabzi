import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export type DialogKind = 'confirm' | 'destructive' | 'permission';

export function Dialog({
  visible,
  kind = 'confirm',
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
  illustration,
}: {
  visible: boolean;
  kind?: DialogKind;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  illustration?: ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.scrim, { backgroundColor: t.colors.scrim, padding: t.spacing.xl }]} onPress={onCancel} accessibilityLabel={cancelLabel}>
        <Pressable
          testID={`dialog-${kind}`}
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={{ backgroundColor: t.colors.bg, borderRadius: t.radius.dialog, padding: t.spacing.xl, gap: t.spacing.sm, width: '100%' }}
          onPress={() => undefined}
        >
          {illustration ? <View style={styles.center}>{illustration}</View> : null}
          <Text variant="h1" style={{ fontSize: t.type.h1.fontSize - 4, lineHeight: t.type.h1.lineHeight - 4 }}>{title}</Text>
          {body ? <Text variant="bodySmall" color="textSecondary">{body}</Text> : null}
          <View style={[styles.actions, { gap: t.spacing.xs, marginTop: t.spacing.xs }]}>
            {kind === 'permission' ? (
              <View style={{ flex: 1, gap: t.spacing.xs }}>
                <Button label={confirmLabel} onPress={onConfirm} loading={loading} />
                <Button label={cancelLabel} variant="tertiary" onPress={onCancel} />
              </View>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label={confirmLabel} variant={kind === 'destructive' ? 'destructive' : 'primary'} loading={loading} onPress={onConfirm} />
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  center: { alignItems: 'center' },
});
