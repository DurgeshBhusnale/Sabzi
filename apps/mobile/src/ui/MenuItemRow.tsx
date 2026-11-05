import { StyleSheet, View } from 'react-native';
import { formatPrice, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { ItemArt } from './Avatar';
import { StatusPill } from './StatusPill';
import { Text } from './Text';
import { en } from '../i18n/en';

/** Buyer menu row: normal, sold out (greyed, struck price), deal (old price struck, new price in amber badge). */
export function MenuItemRow({
  name,
  price,
  unit,
  soldOut = false,
  dealPrice,
}: {
  name: string;
  price: number;
  unit: PriceUnit;
  soldOut?: boolean;
  dealPrice?: number | null;
}) {
  const t = useTheme();
  const deal = !soldOut && dealPrice != null && dealPrice < price;
  const a11y = soldOut ? `${name}, ${en.menu.soldOut}` : deal ? `${name}, ${formatPrice(dealPrice!, unit)}, was ${formatPrice(price, unit)}` : `${name}, ${formatPrice(price, unit)}`;
  return (
    <View accessible accessibilityLabel={a11y} testID={`menu-row-${name}`} style={[styles.row, { minHeight: t.layout.listRowWithImage, gap: t.spacing.sm, opacity: soldOut ? 0.7 : 1 }]}>
      <ItemArt name={name} size={40} muted={soldOut} />
      <View style={styles.flex}>
        <Text color={soldOut ? 'textSecondary' : 'textPrimary'}>{name}</Text>
        {soldOut || deal ? (
          <Text variant="caption" color="textMuted" strike>
            {formatPrice(price, unit)}
          </Text>
        ) : null}
      </View>
      {soldOut ? (
        <StatusPill status="sold_out" label={en.menu.soldOut} />
      ) : deal ? (
        <View style={{ backgroundColor: t.colors.dealAmber, borderRadius: t.radius.chip, paddingHorizontal: t.spacing.xs, paddingVertical: t.spacing.xxs }}>
          <Text variant="price" color="onDealAmber">{formatPrice(dealPrice!, unit)}</Text>
        </View>
      ) : (
        <Text variant="price">{formatPrice(price, unit)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, flex: { flex: 1 } });
