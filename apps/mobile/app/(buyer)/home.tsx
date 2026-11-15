import { useTheme } from '../../src/theme/ThemeProvider';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, TopAppBar } from '../../src/ui';
import { NetworkBanner } from '../../src/features/system/NetworkBanner';
import { X01NoInternet } from '../../src/features/system/SystemStates';
import { useOffline } from '../../src/lib/offline/OfflineProvider';
import { NotificationsBlockedBanner } from '../../src/features/notifications/BlockedBanner';
import { HomeView } from '../../src/features/buyer/HomeView';
import { SocietySwitcher } from '../../src/features/buyer/SocietySwitcher';
import { buyerKeys, useBuyerHome, useMySocieties, useNotifications } from '../../src/features/buyer/hooks';
import { useBuyer } from '../../src/features/buyer/BuyerContext';
import { removeSociety, setPrimarySociety } from '../../src/features/buyer/api';
import { VendorPickerSheet } from '../../src/features/engagement/VendorPickerSheet';

/** B-03 + B-04 */
export default function BuyerHome() {
  const t = useTheme();
  const { societyId, setSocietyId } = useBuyer();
  const mine = useMySocieties();
  const home = useBuyerHome(societyId);
  const notifs = useNotifications();
  const qc = useQueryClient();
  const [switcher, setSwitcher] = useState(false);
  const [picker, setPicker] = useState(false);
  const { online } = useOffline();
  if (!online && !home.data && !home.isLoading) return <X01NoInternet onRetry={() => home.refetch()} />;
  const current = mine.data?.find((s) => s.id === societyId);
  return (
    <Screen
      tone="forest"
      header={<TopAppBar tone="forest" society={current?.name ?? '…'} onSocietyPress={(mine.data?.length ?? 0) >= 2 ? () => setSwitcher(true) : undefined} onBellPress={() => router.push('/buyer/notifications')} unread={(notifs.data ?? []).some((n) => !n.opened_at)} />}
      refreshing={home.isRefetching}
      onRefresh={() => home.refetch()}
    >
      <View style={{ paddingHorizontal: t.spacing.screen, gap: t.spacing.xs }}>
        <NetworkBanner dataUpdatedAt={home.dataUpdatedAt || undefined} />
        <NotificationsBlockedBanner role="buyer" />
      </View>
      <HomeView
        vendors={home.data}
        loading={home.isLoading}
        updatedAt={home.dataUpdatedAt || undefined}
        actions={{
          openVendor: (id) => router.push({ pathname: '/buyer/vendor/[id]', params: { id } }),
          follow: (id) => router.push({ pathname: '/buyer/vendor/[id]', params: { id, follow: '1' } }),
          openDeals: () => router.push('/buyer/deals'),
          requestTomorrow: () => setPicker(true),
          tellUs: () => router.push({ pathname: '/buyer-setup/not-served', params: { name: current?.name ?? '', id: current?.id ?? '' } }),
          switchSociety: () => setSwitcher(true),
        }}
      />
      <VendorPickerSheet
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(v) => {
          setPicker(false);
          router.push({ pathname: '/buyer/request', params: { vendorId: v.id, name: v.name } });
        }}
      />
      <SocietySwitcher
        visible={switcher}
        onClose={() => setSwitcher(false)}
        societies={mine.data ?? []}
        current={societyId}
        onPick={(id) => {
          setSocietyId(id);
          setSwitcher(false);
        }}
        onMakePrimary={async (id) => {
          await setPrimarySociety(id);
          qc.invalidateQueries({ queryKey: buyerKeys.mine });
        }}
        onRemove={async (id) => {
          await removeSociety(id);
          qc.invalidateQueries({ queryKey: buyerKeys.mine });
        }}
        onAdd={() => {
          setSwitcher(false);
          router.push('/buyer-setup/society');
        }}
      />
    </Screen>
  );
}
