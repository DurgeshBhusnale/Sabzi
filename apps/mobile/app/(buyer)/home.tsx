import { router } from 'expo-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, TopAppBar } from '../../src/ui';
import { NotificationsBlockedBanner } from '../../src/features/notifications/BlockedBanner';
import { HomeView } from '../../src/features/buyer/HomeView';
import { SocietySwitcher } from '../../src/features/buyer/SocietySwitcher';
import { buyerKeys, useBuyerHome, useMySocieties, useNotifications } from '../../src/features/buyer/hooks';
import { useBuyer } from '../../src/features/buyer/BuyerContext';
import { removeSociety, setPrimarySociety } from '../../src/features/buyer/api';

/** B-03 + B-04 */
export default function BuyerHome() {
  const { societyId, setSocietyId } = useBuyer();
  const mine = useMySocieties();
  const home = useBuyerHome(societyId);
  const notifs = useNotifications();
  const qc = useQueryClient();
  const [switcher, setSwitcher] = useState(false);
  const current = mine.data?.find((s) => s.id === societyId);
  const firstGate = home.data?.[0]?.gate_name;
  return (
    <Screen
      header={<TopAppBar society={current ? `${current.name.replace(' Residency', '')}${firstGate ? `, ${firstGate}` : ''}` : '…'} onSocietyPress={() => setSwitcher(true)} onBellPress={() => router.push('/buyer/notifications')} unread={(notifs.data ?? []).some((n) => !n.opened_at)} />}
      refreshing={home.isRefetching}
      onRefresh={() => home.refetch()}
    >
      <NotificationsBlockedBanner role="buyer" />
      <HomeView
        vendors={home.data}
        loading={home.isLoading}
        actions={{
          openVendor: (id) => router.push({ pathname: '/buyer/vendor/[id]', params: { id } }),
          openDeals: () => router.push('/buyer/deals'),
          requestTomorrow: () => router.push('/(buyer)/following'),
          tellUs: () => router.push({ pathname: '/buyer-setup/not-served', params: { name: current?.name ?? '', id: current?.id ?? '' } }),
          switchSociety: () => setSwitcher(true),
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
