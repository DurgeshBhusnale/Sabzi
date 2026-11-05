import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Avatar, Button, Text } from '../../ui';
import { en } from '../../i18n/en';

export type InAppMessage = { id: string; title: string; body: string; vendorName?: string; onView: () => void };

/** §9.2: top banner card when the app is open; auto-hides after 5 seconds. */
export function InAppBanner({ message, onDismiss }: { message: InAppMessage | null; onDismiss: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, t.motion.inAppBannerMs);
    return () => clearTimeout(id);
  }, [message, onDismiss, t.motion.inAppBannerMs]);
  if (!message) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + t.spacing.xs, paddingHorizontal: t.spacing.screen }]}>
      <Pressable
        testID="in-app-banner"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        onPress={() => {
          message.onView();
          onDismiss();
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: t.spacing.sm,
          shadowColor: t.colors.shadow,
          shadowOpacity: t.elevation.raised.shadowOpacity,
          shadowRadius: t.elevation.raised.shadowRadius,
          elevation: t.elevation.raised.elevation,
        }}
      >
        <Avatar name={message.vendorName ?? message.title} size={40} />
        <View style={{ flex: 1 }}>
          <Text weight="700" numberOfLines={1}>{message.title}</Text>
          <Text variant="bodySmall" color="textSecondary" numberOfLines={2}>{message.body}</Text>
        </View>
        <Button label={en.notifications.view} variant="tertiary" fullWidth={false} onPress={() => { message.onView(); onDismiss(); }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { position: 'absolute', left: 0, right: 0, zIndex: 100 } });
