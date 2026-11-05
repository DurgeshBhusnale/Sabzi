import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Bell, BellOff, Tag } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, EmptyState, Icon, Screen, SkeletonBlock, Snackbar, Text, TopAppBar, VendorCard } from '../../src/ui';
import { useFollowing } from '../../src/features/buyer/hooks';
import { unfollow } from '../../src/features/buyer/api';
import { publicUrl } from '../../src/lib/storage';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** B-08: followed vendors with live status, society, notification icons, unfollow. */
export default function Following() {
  const t = useTheme();
  const following = useFollowing();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  return (
    <Screen header={<TopAppBar title={en.buyer.followingTitle} />} refreshing={following.isRefetching} onRefresh={() => following.refetch()}>
      {toast ? <Snackbar kind="info" message={toast} /> : null}
      {following.isLoading ? (
        <SkeletonBlock kind="vendorCard" count={3} />
      ) : !following.data?.length ? (
        <EmptyState illustration="crate" title={en.buyer.notFollowingTitle} body={en.buyer.notFollowingBody} actionLabel={en.buyer.findVendors} onAction={() => router.push('/(buyer)/home')} testID="following-empty" />
      ) : (
        following.data.map((f) => (
          <View key={`${f.vendor_id}-${f.society_id}`} style={{ gap: t.spacing.xxs }}>
            <VendorCard
              vendor={{
                id: f.vendor_id,
                name: f.display_name,
                photoUrl: publicUrl('vendor-photos', f.photo_path),
                rating: Number(f.avg_rating),
                ratingCount: f.rating_count,
                vehicle: f.vehicle,
                delivery: f.delivery_available,
                status: f.today?.status ?? 'expected',
                gateName: f.today?.gate_name,
                windowStart: f.today?.window_start,
                windowEnd: f.today?.window_end,
                since: f.today?.status_at,
              }}
              onPress={() => router.push({ pathname: '/buyer/vendor/[id]', params: { id: f.vendor_id, society: f.society_id } })}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, paddingHorizontal: t.spacing.xs }}>
              <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>{f.society_name}</Text>
              <Icon icon={f.notify_arrival ? Bell : BellOff} size={16} color={f.notify_arrival ? 'primary' : 'textMuted'} />
              <Icon icon={Tag} size={16} color={f.notify_deals ? 'dealAmber' : 'textMuted'} />
              <Button
                label={en.buyer.unfollow}
                variant="tertiary"
                fullWidth={false}
                onPress={async () => {
                  await unfollow(f.vendor_id, f.society_id);
                  track('vendor_unfollowed');
                  setToast(en.buyer.unfollowedSnack(f.display_name.split(' ')[0]!));
                  await qc.invalidateQueries({ queryKey: ['buyer'] });
                }}
              />
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
