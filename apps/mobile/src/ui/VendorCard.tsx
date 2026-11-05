import { Image, StyleSheet, View } from 'react-native';
import { formatPrice, statusLabel, type PriceUnit, type VendorLiveStatus } from '@sabzi/shared';
import { useTheme } from '../theme/ThemeProvider';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { SkeletonBlock } from './Skeleton';
import { StatusPill } from './StatusPill';
import { Text } from './Text';
import { en } from '../i18n/en';

export type VendorCardData = {
  id: string;
  name: string;
  photoUrl?: string | null;
  stockPhotoUrl?: string | null;
  stockPhotoTime?: string | null;
  rating: number;
  ratingCount: number;
  vehicle: 'tempo' | 'thela';
  delivery: boolean;
  status: VendorLiveStatus;
  gateName?: string;
  windowStart?: string;
  windowEnd?: string;
  since?: string | null;
  topItems?: { name: string; price: number; unit: PriceUnit }[];
  itemCount?: number;
};

function ratingLine(v: VendorCardData) {
  const s = en.vendorCard;
  const rating = v.ratingCount > 0 ? `${v.rating.toFixed(1)} (${v.ratingCount})` : s.newVendor;
  return [rating, v.vehicle === 'tempo' ? s.tempo : s.thela, v.delivery ? s.delivery : s.pickup].join(' · ');
}

/** Buyer vendor card: compact list row or large hero for "At the gate now". */
export function VendorCard({
  vendor,
  size = 'compact',
  loading = false,
  onPress,
  onViewMenu,
}: {
  vendor?: VendorCardData;
  size?: 'compact' | 'large';
  loading?: boolean;
  onPress?: () => void;
  onViewMenu?: () => void;
}) {
  const t = useTheme();
  if (loading || !vendor) return <SkeletonBlock kind="vendorCard" />;
  const label = statusLabel(vendor.status, { gateName: vendor.gateName, windowStart: vendor.windowStart, windowEnd: vendor.windowEnd, since: vendor.since });
  const pillStatus = vendor.status;

  if (size === 'large') {
    return (
      <Card style={{ padding: 0, overflow: 'hidden' }} testID={`vendor-card-large-${vendor.id}`}>
        {vendor.stockPhotoUrl ? (
          <Image accessibilityLabel={en.vendorCard.stockPhoto} source={{ uri: vendor.stockPhotoUrl }} style={[styles.photo, { backgroundColor: t.colors.surface2 }]} />
        ) : null}
        <View style={{ padding: t.spacing.md, gap: t.spacing.sm }}>
          <StatusPill status={pillStatus} label={label} large />
          <View style={[styles.row, { gap: t.spacing.sm }]}>
            <Avatar name={vendor.name} uri={vendor.photoUrl} size={40} />
            <View style={styles.flex}>
              <Text variant="h2">{vendor.name}</Text>
              <Text variant="bodySmall" color="textSecondary">{ratingLine(vendor)}</Text>
            </View>
          </View>
          {vendor.topItems?.slice(0, 3).map((i) => (
            <View key={i.name} style={styles.between}>
              <Text>{i.name}</Text>
              <Text variant="body" weight="700">{formatPrice(i.price, i.unit)}</Text>
            </View>
          ))}
          <Button label={en.vendorCard.viewMenu(vendor.itemCount ?? 0)} onPress={onViewMenu ?? onPress} />
        </View>
      </Card>
    );
  }

  const muted = vendor.status === 'left' || vendor.status === 'not_coming';
  return (
    <Card onPress={onPress} testID={`vendor-card-${vendor.id}`} accessibilityLabel={`${vendor.name}, ${label}`}>
      <View style={[styles.row, { gap: t.spacing.sm, minHeight: t.layout.listRowWithImage - t.spacing.md * 2 }]}>
        <Avatar name={vendor.name} uri={vendor.photoUrl} size={48} />
        <View style={[styles.flex, { gap: t.spacing.xxs }]}>
          <Text variant="body" weight="600" color={muted ? 'textSecondary' : 'textPrimary'}>{vendor.name}</Text>
          <Text variant="bodySmall" color="textSecondary">{ratingLine(vendor)}</Text>
          <StatusPill status={pillStatus} label={label} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 16 / 9 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  flex: { flex: 1 },
});
