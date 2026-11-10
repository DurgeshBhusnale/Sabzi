import { CircleCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type SnackbarKind = 'success' | 'info' | 'error';

/** Dark ground in both themes. With `undoSeconds`, shows a countdown and an Undo action. */
export function Snackbar({
  message,
  kind = 'info',
  actionLabel,
  onAction,
  undoSeconds,
  onTimeout,
  testID = 'snackbar',
}: {
  message: string;
  kind?: SnackbarKind;
  actionLabel?: string;
  onAction?: () => void;
  undoSeconds?: number;
  onTimeout?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const [left, setLeft] = useState(undoSeconds ?? 0);
  useEffect(() => {
    if (!undoSeconds) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          onTimeout?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoSeconds]);

  return (
    <View
      testID={`${testID}-${kind}`}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.bar,
        {
          backgroundColor: t.colors.snackbarBg,
          borderRadius: t.radius.button,
          paddingHorizontal: t.spacing.md,
          minHeight: t.layout.minTouch + 8,
          gap: t.spacing.sm,
          shadowColor: t.colors.shadow,
          shadowOpacity: t.elevation.raised.shadowOpacity,
          shadowRadius: t.elevation.raised.shadowRadius,
          elevation: t.elevation.raised.elevation,
        },
      ]}
    >
      {kind === 'success' ? <CircleCheck size={18} color={t.colors.mint} fill={t.colors.mint} stroke={t.colors.snackbarBg} /> : null}
      <Text variant="bodySmall" weight="500" style={[styles.flex, { color: t.colors.snackbarText }]}>{message}</Text>
      {actionLabel && (!undoSeconds || left > 0) ? (
        <Pressable
          testID={`${testID}-action`}
          accessibilityRole="button"
          accessibilityLabel={undoSeconds ? `${actionLabel}, ${left} seconds left` : actionLabel}
          onPress={onAction}
          style={[styles.action, { minHeight: t.layout.minTouch, gap: t.spacing.xs }]}
        >
          {undoSeconds ? (
            <View style={[styles.ring, { borderColor: t.colors.snackbarAction }]}>
              <Text variant="caption" style={{ color: t.colors.snackbarAction }} testID={`${testID}-countdown`}>
                {String(left)}
              </Text>
            </View>
          ) : null}
          <Text variant="button" style={{ color: t.colors.snackbarAction }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ring: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
