import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { formatIstTime, groupBySlot, toIstDate } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { BottomSheet, Button, EmptyState, Eyebrow, Screen, SectionHeader, Snackbar, Text, TopAppBar } from '../../src/ui';
import { DeliveryOrders } from '../../src/features/engagement/DeliveryOrders';
import { markDelivery, vendorRequests } from '../../src/features/engagement/api';
import { SoldOutList } from '../../src/features/vendor/SoldOutList';
import { currentStop } from '../../src/features/vendor/arrival';
import { eventOpenCount, leavingSoon, left } from '../../src/features/vendor/api';
import { useInvalidateVendor, useSoldOut, useStopsToday, useTodayMenu, vendorKeys } from '../../src/features/vendor/hooks';
import { en } from '../../src/i18n/en';
import { useOffline } from '../../src/lib/offline/OfflineProvider';

/**
 * V-09: live banner, leaving soon / I've left, quick sold-out list, live open count.
 * Request flow v2: after Leaving soon or I've left, "Hand over these orders?" lists this stop's confirmed orders
 * (Delivered / Not delivered). The same list stays reachable from the screen and from the Confirmed list tab.
 */
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
  const qc = useQueryClient();
  const reqs = useQuery({ queryKey: ['vendor', 'requests'], queryFn: () => vendorRequests(), refetchInterval: 30_000 });
  const [handOver, setHandOver] = useState<null | 'leaving' | 'left'>(null);
  const visit = live && reqs.data ? groupBySlot(reqs.data).find((v) => v.stop_id === live.stopId && v.for_date === toIstDate()) : undefined;
  const orders = visit?.orders ?? [];
  const pending = orders.filter((o) => o.state === 'pending').length;
  const closeHandOver = () => {
    const after = handOver;
    setHandOver(null);
    if (after === 'left') router.replace('/(vendor)/today');
  };

  if (!live) {
    return (
      <Screen header={<TopAppBar onBack={() => router.back()} />}>
        <EmptyState title={en.vendor.todaysStops} body={en.vendor.noStopsToday} actionLabel={en.common.goHome} onAction={() => router.replace('/(vendor)/today')} />
      </Screen>
    );
  }
  return (
    <Screen
      tone="forest"
      header={<TopAppBar tone="forest" compact onBack={() => router.back()} />}
      footer={
        <View style={{ gap: t.spacing.sm }}>
          <View>
            <Button
              size="xl"
              variant="secondary"
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
                  if (pending) setHandOver('leaving');
                } finally {
                  setBusy(null);
                }
              }}
            />
          </View>
          <View>
            <Button
              size="xl"
              label={en.vendor.iveLeft}
              loading={busy === 'left'}
              testID="ive-left"
              onPress={async () => {
                setBusy('left');
                try {
                  await offline.runOrQueue('vendor_left', { gate_id: live.gateId }, 'left', (cid) => left(live.gateId, cid));
                  await invalidate(vendorKeys.stops);
                  if (pending) setHandOver('left');
                  else router.replace('/(vendor)/today');
                } finally {
                  setBusy(null);
                }
              }}
            />
          </View>
        </View>
      }
      hero={
        <View style={{ gap: t.spacing.sm }} testID="live-mode">
          <Eyebrow live onDark>{en.vendor.live}</Eyebrow>
          <Text variant="h1" color="onForest">{`${en.vendor.youreAt(live.societyName, live.gateName)} ${en.vendor.sinceTime(formatIstTime(live.arrivedAt!))}`}</Text>
          <Text variant="bodySmall" color="onForestMuted">{en.vendor.openedAlert(opens.data ?? 0)}</Text>
        </View>
      }
    >
      {toast ? <Snackbar kind="success" message={toast} /> : null}
      {orders.length ? (
        <View style={{ gap: t.spacing.xs }} testID="live-orders">
          <SectionHeader title={en.req.ordersTitle} />
          <Button size="xl" variant={pending ? 'primary' : 'secondary'} label={pending ? `${en.req.handOverTitle.replace('?', '')} (${pending})` : en.req.ordersTitle} onPress={() => setHandOver('leaving')} testID="open-hand-over" />
        </View>
      ) : null}
      <SectionHeader title={en.vendor.soldOutQ} />
      {menu.data ? <SoldOutList menu={menu.data} onToggle={(itemId, soldOut) => sold.mutate({ itemId, soldOut })} /> : null}
      <Button label={en.vendor.eveningDealLink} variant="tertiary" onPress={() => router.push('/vendor/deal')} testID="live-deal-link" />
      <BottomSheet visible={!!handOver && !!visit} onClose={closeHandOver} title={en.req.handOverTitle} testID="hand-over-sheet"
        footer={<Button label={en.req.handOverDone} onPress={closeHandOver} testID="hand-over-done" />}>
        <Text variant="bodySmall" color="textSecondary">{en.req.handOverSub}</Text>
        {visit ? (
          <DeliveryOrders orders={orders} enabled={visit.deliverable} onMark={async (ids, outcome, reason) => {
            await markDelivery(ids, outcome, reason);
            await qc.invalidateQueries({ queryKey: ['vendor', 'requests'] });
          }} testID="hand-over-orders" />
        ) : null}
      </BottomSheet>
    </Screen>
  );
}
