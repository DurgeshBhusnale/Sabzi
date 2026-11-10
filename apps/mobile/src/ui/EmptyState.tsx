import { View } from 'react-native';
import { ShoppingBasket, Bell, ClipboardList, Store, Truck, WifiOff, Search, Star, MapPin, Camera, Lock, Wrench, Handshake, DoorOpen, Hourglass } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { IllustrationImage, type IllustrationArt } from './Art';
import { Button } from './Button';
import { Icon, type LucideIcon } from './Icon';
import { Text } from './Text';

export const ILLUSTRATIONS = { crate: ShoppingBasket, bell: Bell, list: ClipboardList, store: Store, tempo: Truck, offline: WifiOff, search: Search, star: Star, pin: MapPin, camera: Camera, lock: Lock, tools: Wrench, handshake: Handshake, door: DoorOpen, hourglass: Hourglass } as const;
export type Illustration = keyof typeof ILLUSTRATIONS;

/** Circle tint per icon, from the v4 state screens (sage, amber, plum, blush). */
const TINT: Partial<Record<Illustration, 'sage' | 'dealAmberTint' | 'plum' | 'blush'>> = {
  lock: 'blush',
  camera: 'plum',
  pin: 'dealAmberTint',
  door: 'dealAmberTint',
  hourglass: 'dealAmberTint',
  tools: 'dealAmberTint',
};

/**
 * v4 state block: an illustration from the image pack (`art`) or a 112 dp tinted circle with an icon,
 * a Newsreader title, one line of body and up to two actions.
 */
export function EmptyState({
  illustration = 'crate',
  art,
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  testID = 'empty-state',
}: {
  illustration?: Illustration;
  art?: IllustrationArt;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const size = t.layout.stateArt;
  return (
    <View testID={testID} style={{ alignItems: 'center', paddingHorizontal: t.spacing.xs, paddingVertical: t.spacing.xl, gap: t.spacing.lg }}>
      {art ? (
        <IllustrationImage art={art} size={200} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors[TINT[illustration] ?? 'sage'], alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={ILLUSTRATIONS[illustration] as LucideIcon} size={44} color="primary" />
        </View>
      )}
      <View style={{ gap: t.spacing.xs, alignItems: 'center', maxWidth: 320 }}>
        <Text variant="h1" align="center" accessibilityRole="header" style={{ fontSize: t.type.h1.fontSize - 2 }}>{title}</Text>
        {body ? <Text variant="bodySmall" color="textSecondary" align="center" style={{ fontSize: t.type.bodySmall.fontSize + 1, lineHeight: t.type.bodySmall.lineHeight + 2 }}>{body}</Text> : null}
      </View>
      {actionLabel || secondaryLabel ? (
        <View style={{ alignSelf: 'stretch', gap: t.spacing.xs }}>
          {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
          {secondaryLabel ? <Button label={secondaryLabel} variant="tertiary" onPress={onSecondary} /> : null}
        </View>
      ) : null}
    </View>
  );
}
