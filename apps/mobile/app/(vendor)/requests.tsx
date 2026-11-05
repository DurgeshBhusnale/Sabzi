import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, groupRequests, toIstDate } from '@sabzi/shared';
import { Screen, TopAppBar } from '../../src/ui';
import { VendorRequestsView } from '../../src/features/engagement/VendorRequestsView';
import { answerRequest, vendorRequests } from '../../src/features/engagement/api';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

const label = (iso: string) => {
  const d = new Date(Date.parse(`${iso}T00:00:00Z`));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
};

/** V-13 */
export default function VendorRequests() {
  const tomorrow = addDays(toIstDate(), 1);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['vendor', 'requests'], queryFn: () => vendorRequests(), refetchInterval: 120_000 });
  const groups = q.data ? groupRequests(q.data.filter((r) => r.for_date === tomorrow)) : undefined;
  return (
    <Screen header={<TopAppBar title={en.nav.vendorTabs.requests} />} refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <VendorRequestsView
        groups={groups}
        loading={q.isLoading}
        dateLabel={label(tomorrow)}
        onShareQr={() => router.push('/vendor/qr')}
        onAnswer={async (key, status) => {
          await answerRequest(key, status, tomorrow);
          track('request_answered', { status });
          await qc.invalidateQueries({ queryKey: ['vendor', 'requests'] });
        }}
      />
    </Screen>
  );
}
