import { StyleSheet, View } from 'react-native';
import { formatAmount, formatPrice, UNIT_LABELS, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { ItemArt } from './Art';
import { Text } from './Text';
import { en } from '../i18n/en';

/** Buyer menu row: normal, sold out (greyed, struck price), deal (old price struck, new price in amber badge). */
export function MenuItemRow({
  name,
  price,
  unit,
  soldOut = false,
  dealPrice,
  last = false,
}: {
  name: string;
  price: number;
  unit: PriceUnit;
  soldOut?: boolean;
  dealPrice?: number | null;
  last?: boolean;
}) {
  const t = useTheme();
  const deal = !soldOut && dealPrice != null && dealPrice < price;
  const a11y = soldOut ? `${name}, ${en.menu.soldOut}` : deal ? `${name}, ${formatPrice(dealPrice!, unit)}, was ${formatPrice(price, unit)}` : `${name}, ${formatPrice(price, unit)}`;
  return (
    <View
      accessible
      accessibilityLabel={a11y}
      testID={`menu-row-${name}`}
      style={[styles.row, { minHeight: t.layout.listRowWithImage, gap: t.spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.border, opacity: soldOut ? 0.55 : 1 }]}
    >
      <ItemArt name={name} size={36} />
      <View style={styles.flex}>
        <Text variant="label">{name}</Text>
        {soldOut ? (
          <Text variant="caption" weight="400" color="error">{en.menu.soldOut}</Text>
        ) : deal ? (
          <Text variant="caption" weight="400" color="dealAmberText">{en.menu.dealWas(formatAmount(price))}</Text>
        ) : null}
      </View>
      <Text variant="price" strike={soldOut}>
        {formatAmount(deal ? dealPrice! : price)}
        <Text variant="caption" weight="400" color="textSecondary">{` /${UNIT_LABELS[unit]}`}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
