import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { IllustrationImage, Screen, Snackbar } from '../../src/ui';
import { en } from '../../src/i18n/en';
import { useSession } from '../../src/features/auth/session';
import { PendingActionsChip } from '../../src/features/system/PendingActions';
import { NetworkBanner } from '../../src/features/system/NetworkBanner';
import { NotificationsBlockedBanner } from '../../src/features/notifications/BlockedBanner';
import { TodayView } from '../../src/features/vendor/TodayView';
import { useInvalidateVendor, useMyVendor, useStats, useStopsToday, useTodayMenu, vendorKeys } from '../../src/features/vendor/hooks';
import { currentStop } from '../../src/features/vendor/arrival';
import { eventOpenCount } from '../../src/features/vendor/api';

/** V-04 */
export default function VendorToday() {
  const { account } = useSession();
  const vendor = useMyVendor();
  const menu = useTodayMenu();
  const stops = useStopsToday();
  const stats = useStats();
  const invalidate = useInvalidateVendor();
  const live = currentStop(stops.data ?? []);
  const opens = useQuery({ queryKey: ['vendor', 'opens', live?.arrivalEventId], queryFn: () => eventOpenCount(live!.arrivalEventId!), enabled: !!live?.arrivalEventId, refetchInterval: 30_000 });
  const refreshing = menu.isRefetching || stops.isRefetching;
  const { published } = useLocalSearchParams<{ published?: string }>();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const toast = published && dismissed !== published ? en.vendor.liveFor(Number(published)) : null;
  useEffect(() => {
    if (!published) return;
    const id = setTimeout(() => setDismissed(published), 4000);
    return () => clearTimeout(id);
  }, [published]);
  return (
    <Screen tone="forest" refreshing={refreshing} onRefresh={() => invalidate(vendorKeys.today, vendorKeys.stops, vendorKeys.stats, vendorKeys.me)}>
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        <NetworkBanner dataUpdatedAt={menu.dataUpdatedAt || undefined} />
        <PendingActionsChip />
        <NotificationsBlockedBanner role="vendor" />
      </View>
      <TodayView
        vendor={vendor.data}
        name={account?.name ?? ''}
        menu={menu.data}
        stops={stops.data}
        stats={stats.data}
        loading={menu.isLoading || stops.isLoading}
        openCount={opens.data ?? 0}
        actions={{
          onSetMenu: () => router.push('/vendor/menu'),
          onAddPhoto: () => router.push('/vendor/photo'),
          onOpenLive: () => router.push('/vendor/live'),
          onSendDeal: () => router.push('/vendor/deal'),
          onNotifications: () => router.push('/(vendor)/requests'),
        }}
      />
      {toast ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 96, alignItems: 'center', gap: 12 }} testID="menu-published">
          <IllustrationImage art="menuPublished" size={160} />
          <View style={{ alignSelf: 'stretch' }}>
            <Snackbar kind="success" message={toast} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
