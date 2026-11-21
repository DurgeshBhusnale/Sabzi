import { router } from 'expo-router';
import { View } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, EmptyState, Screen, SectionLabel, Sections, SkeletonBlock, TopAppBar } from '../../src/ui';
import { VendorPickerSheet } from '../../src/features/engagement/VendorPickerSheet';
import { myRequests } from '../../src/features/engagement/api';
import { sectionRequests } from '../../src/features/engagement/requestView';
import { BuyerRequestCard } from '../../src/features/engagement/BuyerRequestCard';
import { en } from '../../src/i18n/en';

/** B-12 (request flow v2): one card per request — needs your reply first, then upcoming, then past. */
export default function BuyerRequests() {
  const t = useTheme();
  const q = useQuery({ queryKey: ['eng', 'my-requests'], queryFn: () => myRequests(), refetchInterval: 60_000 });
  const [picker, setPicker] = useState(false);
  const s = q.data ? sectionRequests(q.data) : null;
  const open = (id: string) => router.push({ pathname: '/buyer/requests/[id]', params: { id } });
  const section = (label: string, rows: NonNullable<typeof q.data>, testID: string) =>
    rows.length ? (
      <View key={label} style={{ gap: t.spacing.stackGap }} testID={testID}>
        <SectionLabel>{label}</SectionLabel>
        {rows.map((r) => <BuyerRequestCard key={r.id} request={r} onPress={() => open(r.id)} />)}
      </View>
    ) : null;
  return (
    <Screen
      header={<TopAppBar title={en.eng.myRequests} />}
      footer={q.data?.length ? <Button label={en.buyer.newRequest} variant="secondary" onPress={() => setPicker(true)} testID="new-request" /> : undefined}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    >
      {q.isLoading ? (
        <SkeletonBlock kind="list" count={3} />
      ) : q.isError && !q.data ? (
        <EmptyState illustration="list" title={en.req.loadError} body={en.errors.unknown} actionLabel={en.common.retry} onAction={() => q.refetch()} testID="requests-error" />
      ) : !q.data?.length ? (
        <EmptyState illustration="list" art="noRequests" title={en.eng.noRequestsTitle} body={en.eng.noRequestsBody} actionLabel={en.buyer.newRequest} onAction={() => setPicker(true)} testID="requests-empty" />
      ) : (
        <Sections>
          {q.isError ? <Banner kind="error" message={en.req.loadError} /> : null}
          {section(en.req.sectionAction, s!.action, 'section-action')}
          {section(en.req.sectionUpcoming, s!.upcoming, 'section-upcoming')}
          {section(en.req.sectionPast, s!.past, 'section-past')}
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
