import { router } from 'expo-router';
import { View } from 'react-native';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, toIstDate } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, EmptyState, RequestCard, Screen, SectionLabel, Sections, SkeletonBlock, TopAppBar } from '../../src/ui';
import { VendorPickerSheet } from '../../src/features/engagement/VendorPickerSheet';
import { cancelRequest, myRequests, type MyRequest } from '../../src/features/engagement/api';
import { en } from '../../src/i18n/en';

function dateLabel(d: string): string {
  const today = toIstDate();
  if (d === addDays(today, 1)) return en.eng.tomorrow;
  if (d === today) return en.eng.today;
  const dt = new Date(`${d}T00:00:00Z`);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** B-12: my requests grouped by date; cancel open ones. */
export default function BuyerRequests() {
  const t = useTheme();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['eng', 'my-requests'], queryFn: () => myRequests() });
  const [picker, setPicker] = useState(false);
  const groups = new Map<string, MyRequest[]>();
  for (const r of q.data ?? []) groups.set(r.for_date, [...(groups.get(r.for_date) ?? []), r]);
  return (
    <Screen
      header={<TopAppBar title={en.eng.myRequests} />}
      footer={q.data?.length ? <Button label={en.buyer.newRequest} variant="secondary" onPress={() => setPicker(true)} testID="new-request" /> : undefined}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    >
      {q.isLoading ? (
        <SkeletonBlock kind="list" count={3} />
      ) : !q.data?.length ? (
        <EmptyState illustration="list" art="noRequests" title={en.eng.noRequestsTitle} body={en.eng.noRequestsBody} actionLabel={en.buyer.newRequest} onAction={() => setPicker(true)} testID="requests-empty" />
      ) : (
        <Sections>
        {[...groups.entries()].map(([date, rs]) => (
          <View key={date} style={{ gap: t.spacing.stackGap }}>
            <SectionLabel>{dateLabel(date)}</SectionLabel>
            {rs.map((r) => (
              <RequestCard
                key={r.id}
                item={r.item_name}
                qty={r.qty}
                note={r.note}
                vendorName={r.vendor_name}
                society={r.society_name}
                status={r.status}
                action={
                  r.status === 'open' ? (
                    <Button label={en.eng.cancel} variant="tertiary" fullWidth={false} onPress={async () => { await cancelRequest(r.id); qc.invalidateQueries({ queryKey: ['eng', 'my-requests'] }); }} />
                  ) : undefined
                }
              />
            ))}
          </View>
        ))}
        </Sections>
      )}
      <VendorPickerSheet
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(v) => {
          setPicker(false);
          router.push({ pathname: '/buyer/request', params: { vendorId: v.id, name: v.name } });
        }}
      />
    </Screen>
  );
}
