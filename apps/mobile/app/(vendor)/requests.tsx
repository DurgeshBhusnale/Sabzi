import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupBySlot } from '@sabzi/shared';
import { Screen, TopAppBar } from '../../src/ui';
import { VendorRequestsView, type VendorTab } from '../../src/features/engagement/VendorRequestsView';
import { answerRequest, vendorRequests } from '../../src/features/engagement/api';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** V-13: Requests (answer per item per visit) and Confirmed list (what to carry) — refreshed every 30 s and after each answer. */
export default function VendorRequests() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<VendorTab>('requests');
  const q = useQuery({ queryKey: ['vendor', 'requests'], queryFn: () => vendorRequests(), refetchInterval: 30_000, refetchOnWindowFocus: true });
  const slots = q.data ? groupBySlot(q.data) : undefined;
  return (
    <Screen header={<TopAppBar title={en.req.vTitle} />} refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <VendorRequestsView
        slots={slots}
        loading={q.isLoading}
        error={q.isError && !!q.data}
        tab={tab}
        onTab={setTab}
        onRetry={() => q.refetch()}
        onShareQr={() => router.push('/vendor/qr')}
        onAnswer={async ({ slot, group, status, price, unit }) => {
          await answerRequest({ key: group.key, status, forDate: slot.for_date, stopId: slot.stop_id, price, unit });
          track('request_answered', { status });
          await qc.invalidateQueries({ queryKey: ['vendor', 'requests'] });
        }}
      />
    </Screen>
  );
}
