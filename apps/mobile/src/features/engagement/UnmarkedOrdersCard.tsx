import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { groupBySlot, type SlotGroup } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Button, Card, RequestStatusBlock } from '../../ui';
import { en } from '../../i18n/en';
import { vendorRequests } from './api';

/** Orders from visits that are over but still not marked Delivered / Not delivered (and can still be marked). */
export function unmarkedOrders(slots: SlotGroup[], now: Date = new Date()): number {
  return slots
    .filter((s) => s.deliverable && Date.parse(s.slot_end) <= now.getTime())
    .reduce((n, s) => n + s.orders.filter((o) => o.state === 'pending').length, 0);
}

/** V-04 reminder: "3 orders not marked yet" → Confirmed list tab. Renders nothing when all are marked. */
export function UnmarkedOrdersCard({ onOpen }: { onOpen: () => void }) {
  const t = useTheme();
  const q = useQuery({ queryKey: ['vendor', 'requests'], queryFn: () => vendorRequests(), refetchInterval: 120_000 });
  const n = q.data ? unmarkedOrders(groupBySlot(q.data)) : 0;
  if (!n) return null;
  return (
    <Card tint="amber" style={{ gap: t.spacing.sm }} testID="unmarked-orders">
      <RequestStatusBlock tone="action" headline={en.req.todayUnmarked(n)} detail={en.req.todayUnmarkedBody} />
      <View>
        <Button size="xl" label={en.req.todayUnmarkedCta} onPress={onOpen} testID="unmarked-orders-open" />
      </View>
    </Card>
  );
}
