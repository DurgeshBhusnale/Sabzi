import { Pressable, StyleSheet, View } from 'react-native';
import { CircleAlert, Clock, Info, Tag, WifiOff, Signal } from 'lucide-react-native';
import type { ColorTokens } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';

export type BannerKind = 'offline' | 'weak' | 'pending' | 'info' | 'deal' | 'error' | 'success';

type K = keyof ColorTokens;
const KINDS: Record<BannerKind, { bg: K; fg: K; icon: LucideIcon }> = {
  offline: { bg: 'surface2', fg: 'textPrimary', icon: WifiOff },
  weak: { bg: 'warningTint', fg: 'warning', icon: Signal },
  pending: { bg: 'warningTint', fg: 'warning', icon: Clock },
  info: { bg: 'infoTint', fg: 'onInfoTint', icon: Info },
  deal: { bg: 'dealAmberTint', fg: 'dealAmberText', icon: Tag },
  error: { bg: 'errorTint', fg: 'onErrorTint', icon: CircleAlert },
  success: { bg: 'primaryTint', fg: 'onPrimaryTint', icon: Info },
};

export function Banner({ kind, message, actionLabel, onAction, testID }: { kind: BannerKind; message: string; actionLabel?: string; onAction?: () => void; testID?: string }) {
  const t = useTheme();
  const k = KINDS[kind];
  return (
    <View
      testID={testID ?? `banner-${kind}`}
      accessibilityRole="alert"
      style={[styles.row, { backgroundColor: t.colors[k.bg], borderRadius: t.radius.card, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, gap: t.spacing.sm }]}
    >
      <Icon icon={k.icon} size={20} color={k.fg} />
      <Text variant="bodySmall" weight="500" color={k.fg} style={styles.flex}>
        {message}
      </Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={12} style={{ minHeight: t.layout.minTouch - 16, justifyContent: 'center' }}>
          <Text variant="bodySmall" weight="600" color={k.fg} style={styles.underline}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 }, underline: { textDecorationLine: 'underline' } });
