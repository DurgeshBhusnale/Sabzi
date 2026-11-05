import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { LIMITS, PILOT_AREA_LABELS } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { BottomSheet, Button, Icon, Text } from '../../ui';
import type { SavedSociety } from './types';
import { en } from '../../i18n/en';

/** B-04: up to 3 saved societies with a primary star; Add disabled with a hint at 3. */
export function SocietySwitcher({
  visible,
  onClose,
  societies,
  current,
  onPick,
  onMakePrimary,
  onRemove,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  societies: SavedSociety[];
  current: string | null;
  onPick: (id: string) => void;
  onMakePrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const t = useTheme();
  const full = societies.length >= LIMITS.maxSocieties;
  return (
    <BottomSheet visible={visible} onClose={onClose} title={en.buyer.yourSocieties} testID="society-switcher-sheet">
      {societies.map((s) => (
        <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: s.id === current }} onPress={() => onPick(s.id)} style={{ flex: 1, minHeight: t.layout.minTouch + 8, justifyContent: 'center' }} testID={`switch-${s.name}`}>
            <Text weight={s.id === current ? '700' : '500'}>{s.name}</Text>
            <Text variant="caption" color="textSecondary">{[PILOT_AREA_LABELS[s.area], s.id === current ? en.buyer.showingNow : null].filter(Boolean).join(' · ')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={s.is_primary ? en.buyer.primary : en.buyer.makePrimary} onPress={() => onMakePrimary(s.id)} style={{ minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={Star} color={s.is_primary ? 'dealAmber' : 'textMuted'} filled={s.is_primary} />
          </Pressable>
          {societies.length > 1 ? <Button label={en.buyer.remove} variant="tertiary" fullWidth={false} onPress={() => onRemove(s.id)} /> : null}
        </View>
      ))}
      <Button label={en.buyer.addSociety} variant="tertiary" disabled={full} onPress={onAdd} testID="add-society" />
      {full ? <Text variant="caption" color="textSecondary">{en.buyer.maxSocieties}</Text> : null}
    </BottomSheet>
  );
}
