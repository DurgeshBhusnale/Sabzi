import { router } from 'expo-router';
import { View } from 'react-native';
import { HelpCircle, ListChecks, QrCode, Settings, Star, Store } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, Screen, SkeletonBlock, StatTile, Text, TopAppBar } from '../../src/ui';
import { LinkRow } from '../../src/features/account/ProfileScreen';
import { useFollowerCounts, useInvalidateVendor, useStats, vendorKeys } from '../../src/features/vendor/hooks';
import { en } from '../../src/i18n/en';

/** V-14: numbers (VEN-11) and links. New vendor with zeros gets encouraging copy. */
export default function VendorMe() {
  const t = useTheme();
  const stats = useStats();
  const counts = useFollowerCounts();
  const invalidate = useInvalidateVendor();
  const max = Math.max(1, ...(counts.data ?? []).map((c) => c.followers));
  const zero = (stats.data?.followers ?? 0) === 0;
  return (
    <Screen header={<TopAppBar title={en.vendor.meTitle} />} refreshing={stats.isRefetching} onRefresh={() => invalidate(vendorKeys.stats, vendorKeys.followers)}>
      {stats.isLoading ? (
        <SkeletonBlock kind="statTile" count={2} />
      ) : zero ? (
        <Card tint="primary" style={{ gap: t.spacing.sm }} testID="zero-stats">
          <Text>{en.vendor.zeroStats}</Text>
          <Button label={en.vendor.myQr} onPress={() => router.push('/vendor/qr')} />
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
            <StatTile value={stats.data!.followers} label={en.vendor.followers} trend={stats.data!.followers_week_change ? `+${stats.data!.followers_week_change} this week` : undefined} />
            <StatTile value={stats.data!.alert_opens_today} label={en.vendor.alertOpens} />
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
            <StatTile value={stats.data!.profile_views_week} label={en.vendor.profileViews} />
            <StatTile value={stats.data!.rating_count ? Number(stats.data!.avg_rating).toFixed(1) : '–'} label={en.vendor.avgRating} />
          </View>
          <Card style={{ gap: t.spacing.sm }}>
            <Text variant="h2">{en.vendor.followersByStop}</Text>
            {(counts.data ?? []).map((c) => (
              <View key={c.society_id} style={{ gap: t.spacing.xxs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text>{c.society_name}</Text>
                  <Text weight="700">{String(c.followers)}</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surface2 }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${(c.followers / max) * 100}%`, backgroundColor: t.colors.brandLeaf }} />
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
      <Card>
        <LinkRow icon={QrCode} label={en.vendor.myQr} onPress={() => router.push('/vendor/qr')} />
        <LinkRow icon={Star} label={en.vendor.myReviews} onPress={() => router.push('/vendor/reviews')} />
        <LinkRow icon={Store} label={en.vendor.businessDetails} onPress={() => router.push('/vendor-setup/details')} />
        <LinkRow icon={ListChecks} label={en.vendor.usualItems} onPress={() => router.push('/vendor-setup/items')} />
        <LinkRow icon={Settings} label={en.profile.settings} onPress={() => router.push('/account/settings')} />
        <LinkRow icon={HelpCircle} label={en.profile.help} onPress={() => router.push('/account/help')} />
      </Card>
    </Screen>
  );
}
