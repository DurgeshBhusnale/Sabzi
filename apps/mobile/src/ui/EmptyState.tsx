import { View } from 'react-native';
import { ShoppingBasket, Bell, ClipboardList, Store, Truck, WifiOff, Search, Star, MapPin, Camera, Lock, Wrench, Handshake } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';

export const ILLUSTRATIONS = { crate: ShoppingBasket, bell: Bell, list: ClipboardList, store: Store, tempo: Truck, offline: WifiOff, search: Search, star: Star, pin: MapPin, camera: Camera, lock: Lock, tools: Wrench, handshake: Handshake } as const;
export type Illustration = keyof typeof ILLUSTRATIONS;

/** Illustration, title, one line, one action (design brief §8). */
export function EmptyState({
  illustration = 'crate',
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  testID = 'empty-state',
}: {
  illustration?: Illustration;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ alignItems: 'center', padding: t.spacing.xl, gap: t.spacing.sm }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.colors.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={ILLUSTRATIONS[illustration] as LucideIcon} size={44} color="brandLeaf" />
      </View>
      <Text variant="h2" align="center" accessibilityRole="header">{title}</Text>
      {body ? <Text color="textSecondary" align="center">{body}</Text> : null}
      {actionLabel ? <Button label={actionLabel} onPress={onAction} fullWidth={false} /> : null}
      {secondaryLabel ? <Button label={secondaryLabel} variant="tertiary" onPress={onSecondary} fullWidth={false} /> : null}
    </View>
  );
}
