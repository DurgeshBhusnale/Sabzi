import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { formatIstTime } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, EmptyState, Screen, Snackbar, Text, TopAppBar } from '../../src/ui';
import { SoldOutList } from '../../src/features/vendor/SoldOutList';
import { currentStop } from '../../src/features/vendor/arrival';
import { eventOpenCount, leavingSoon, left } from '../../src/features/vendor/api';
import { useInvalidateVendor, useSoldOut, useStopsToday, useTodayMenu, vendorKeys } from '../../src/features/vendor/hooks';
import { en } from '../../src/i18n/en';
import { useOffline } from '../../src/lib/offline/OfflineProvider';

/** V-09: live banner, leaving soon / I've left, quick sold-out list, live open count. */
export default function AtTheStop() {
  const t = useTheme();
  const stops = useStopsToday();
  const menu = useTodayMenu();
  const sold = useSoldOut();
  const invalidate = useInvalidateVendor();
  const offline = useOffline();
  const live = currentStop(stops.data ?? []);
  const opens = useQuery({ queryKey: ['vendor', 'opens', live?.arrivalEventId], queryFn: () => eventOpenCount(live!.arrivalEventId!), enabled: !!live?.arrivalEventId, refetchInterval: 15_000 });
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<'leaving' | 'left' | null>(null);

  if (!live) {
    return (
      <Screen header={<TopAppBar onBack={() => router.back()} />}>
        <EmptyState title={en.vendor.todaysStops} body={en.vendor.noStopsToday} actionLabel={en.common.goHome} onAction={() => router.replace('/(vendor)/today')} />
      </Screen>
    );
  }
  return (
    <Screen header={<TopAppBar onBack={() => router.back()} />}>
      <View style={{ backgroundColor: t.colors.primary, borderRadius: t.radius.card, padding: t.spacing.lg, gap: t.spacing.xxs }} testID="live-mode">
        <Text variant="caption" color="onPrimary">{en.vendor.liveAtGate}</Text>
        <Text variant="h1" color="onPrimary">{en.vendor.youreAt(live.societyName, live.gateName)}</Text>
        <Text color="onPrimary">{en.vendor.sinceTime(formatIstTime(live.arrivedAt!))}</Text>
      </View>
      <Card>
        <Text variant="h2">{en.vendor.openedAlert(opens.data ?? 0)}</Text>
      </Card>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            size="xl"
            label={live.leavingAt ? en.vendor.toldLeaving : en.vendor.leaving10}
            disabled={!!live.leavingAt}
            loading={busy === 'leaving'}
            testID="leaving-soon"
            onPress={async () => {
              setBusy('leaving');
              try {
                const r = await offline.runOrQueue('vendor_leaving_soon', { gate_id: live.gateId }, 'leaving', (cid) => leavingSoon(live.gateId, cid));
                setToast(r.queued ? en.system.queuedAction : en.vendor.toldLeavingSnack(live.followers));
                await invalidate(vendorKeys.stops);
              } finally {
                setBusy(null);
              }
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            size="xl"
            variant="secondary"
            label={en.vendor.iveLeft}
            loading={busy === 'left'}
            testID="ive-left"
            onPress={async () => {
              setBusy('left');
              try {
                await offline.runOrQueue('vendor_left', { gate_id: live.gateId }, 'left', (cid) => left(live.gateId, cid));
                await invalidate(vendorKeys.stops);
                router.replace('/(vendor)/today');
              } finally {
                setBusy(null);
              }
            }}
          />
        </View>
      </View>
      {toast ? <Snackbar kind="success" message={toast} /> : null}
      <Text variant="h2">{en.vendor.soldOutQ}</Text>
      {menu.data ? <SoldOutList menu={menu.data} onToggle={(itemId, soldOut) => sold.mutate({ itemId, soldOut })} /> : null}
    </Screen>
  );
}
