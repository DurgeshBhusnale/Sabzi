import { router } from 'expo-router';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { statusLabel } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Avatar, Card, EmptyState, MenuItemRow, Screen, SkeletonBlock, StatusPill, Text, TopAppBar } from '../../src/ui';
import { myDealsToday } from '../../src/features/engagement/api';
import { publicUrl } from '../../src/lib/storage';
import { en } from '../../src/i18n/en';

/** B-13: followed vendors' deals: item, old price struck, new price in amber, where he is now. */
export default function Deals() {
  const t = useTheme();
  const q = useQuery({ queryKey: ['eng', 'deals'], queryFn: () => myDealsToday() });
  const live = (q.data ?? []).filter((d) => d.items.some((i) => !i.sold_out));
  return (
    <Screen header={<TopAppBar title={en.eng.dealsTitle} onBack={() => router.back()} />} refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      {q.isLoading ? (
        <SkeletonBlock kind="menuRow" count={3} />
      ) : live.length === 0 ? (
        <EmptyState illustration="crate" title={en.eng.dealsEnded} body={en.eng.dealsEndedBody} testID="deals-ended" />
      ) : (
        live.map((d) => (
          <Card key={d.vendor_id} onPress={() => router.push({ pathname: '/buyer/vendor/[id]', params: { id: d.vendor_id, society: d.society_id } })} style={{ gap: t.spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <Avatar name={d.vendor_name} uri={publicUrl('vendor-photos', d.photo_path)} size={40} />
              <View style={{ flex: 1, gap: t.spacing.xxs }}>
                <Text weight="700">{d.vendor_name}</Text>
                {d.today ? <StatusPill status={d.today.status} label={statusLabel(d.today.status, { gateName: d.today.gate_name, since: d.today.status_at, windowStart: d.today.window_start, windowEnd: d.today.window_end })} /> : null}
              </View>
            </View>
            {d.items.filter((i) => !i.sold_out).map((i) => (
              <MenuItemRow key={i.item_id} name={i.name} price={Number(i.price)} unit={i.unit} dealPrice={Number(i.deal_price)} />
            ))}
          </Card>
        ))
      )}
    </Screen>
  );
}
