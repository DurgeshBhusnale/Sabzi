import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { formatPrice, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { ItemArt } from './Avatar';
import { Icon } from './Icon';
import { Text } from './Text';
import { en } from '../i18n/en';

export type ItemTileState = 'unselected' | 'selected' | 'priced' | 'sold_out';

/** Vendor 3-column picture tile. Missing price on a selected tile shows a red outline. */
export function ItemTile({
  name,
  state,
  price,
  unit,
  wasPrice,
  missingPrice = false,
  onPress,
  testID,
}: {
  name: string;
  state: ItemTileState;
  price?: number | null;
  unit?: PriceUnit;
  wasPrice?: number | null;
  missingPrice?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  const selected = state === 'selected' || state === 'priced';
  const border = missingPrice ? c.error : selected ? c.primary : c.border;
  const label =
    state === 'sold_out'
      ? `${name}, ${en.menu.soldOut}`
      : state === 'priced' && price != null && unit
        ? `${name}, ${formatPrice(price, unit)}`
        : selected
          ? `${name}, ${en.menu.setPrice}`
          : name;
  return (
    <Pressable
      testID={testID ?? `tile-${name}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          minHeight: 112,
          borderRadius: t.radius.card,
          borderColor: border,
          borderWidth: selected || missingPrice ? 2 : 1,
          backgroundColor: state === 'sold_out' ? c.surface2 : selected ? c.primaryTintStrong : c.surface,
          padding: t.spacing.xs,
          gap: t.spacing.xxs,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {selected ? (
        <View style={[styles.check, { backgroundColor: c.primary, borderRadius: t.radius.pill }]}>
          <Icon icon={Check} size={14} color="onPrimary" />
        </View>
      ) : null}
      <ItemArt name={name} size={44} muted={state === 'sold_out'} />
      {state === 'priced' && price != null && unit ? (
        <>
          <Text variant="bodySmall" weight="700" align="center">{formatPrice(price, unit)}</Text>
          {wasPrice != null && wasPrice !== price ? (
            <Text variant="caption" color="textSecondary">{en.menu.was(wasPrice)}</Text>
          ) : null}
        </>
      ) : (
        <Text variant="bodySmall" weight="600" align="center" numberOfLines={2}>{name}</Text>
      )}
      {state === 'selected' ? <Text variant="caption" color={missingPrice ? 'error' : 'textSecondary'}>{en.menu.setPrice}</Text> : null}
      {state === 'sold_out' ? <Text variant="caption" color="error">{en.menu.soldOut}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
});
