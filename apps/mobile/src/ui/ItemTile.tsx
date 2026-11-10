import { Image, Pressable, StyleSheet, View } from 'react-native';
import { CircleCheck } from 'lucide-react-native';
import { formatPrice, produceTileGround, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { ItemArt, produceSource } from './Art';
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
  showSetPrice = true,
  onPress,
  testID,
}: {
  name: string;
  state: ItemTileState;
  price?: number | null;
  unit?: PriceUnit;
  wasPrice?: number | null;
  missingPrice?: boolean;
  /** V-02 picker hides the "Set price" hint */
  showSetPrice?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const t = useTheme();
  const c = t.colors;
  const selected = state === 'selected' || state === 'priced';
  const label =
    state === 'sold_out'
      ? `${name}, ${en.menu.soldOut}`
      : state === 'priced' && price != null && unit
        ? `${name}, ${formatPrice(price, unit)}`
        : selected && showSetPrice
          ? `${name}, ${en.menu.setPrice}`
          : name;
  const src = produceSource(name);
  const ground = t.scheme === 'dark' ? c.surface2 : produceTileGround(name);
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
          minHeight: 96,
          borderRadius: t.radius.button,
          borderColor: missingPrice ? c.error : selected ? c.primary : 'transparent',
          borderWidth: 2,
          backgroundColor: ground,
          padding: t.spacing.xs,
          gap: 2,
          opacity: pressed ? 0.85 : state === 'sold_out' ? 0.45 : !selected && showSetPrice ? 0.55 : 1,
        },
      ]}
    >
      {selected && !showSetPrice ? (
        <View style={styles.check}>
          <Icon icon={CircleCheck} size={18} color="primary" filled={false} />
        </View>
      ) : null}
      {src ? <Image source={src} resizeMode="contain" style={{ width: 44, height: 44 }} /> : <ItemArt name={name} size={40} />}
      <Text variant="caption" weight="500" align="center" numberOfLines={1} style={{ fontSize: t.type.label.fontSize }}>{name.replace(/\s*\(.*\)/, '')}</Text>
      {state === 'priced' && price != null && unit ? (
        <>
          <Text variant="caption" weight="600" align="center" style={{ fontSize: t.type.label.fontSize + 1 }}>{formatPrice(price, unit)}</Text>
          {wasPrice != null && wasPrice !== price ? <Text variant="caption" weight="400" color="textSecondary" style={{ fontSize: 10 }}>{en.menu.was(wasPrice)}</Text> : null}
        </>
      ) : null}
      {state === 'selected' && showSetPrice ? (
        <Text variant="caption" color={missingPrice ? 'error' : 'textSecondary'} style={{ fontSize: 11 }}>{missingPrice ? en.menu.addPrice : en.menu.setPrice}</Text>
      ) : null}
      {state === 'sold_out' ? <Text variant="caption" color="error" style={{ fontSize: 11 }}>{en.menu.soldOut}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 6, right: 6 },
});
