import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { firstName, formatIstRelative, shortSociety, slotDayLabel, slotWindowLabel } from '@sabzi/shared';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { Banner, Button, Card, Dialog, EmptyState, ItemArt, RequestStatusBlock, Screen, SectionLabel, SkeletonBlock, StatusPill, Text, TopAppBar } from '../../../src/ui';
import { myRequests } from '../../../src/features/engagement/api';
import { buyerRequestView, requestSteps, type Step } from '../../../src/features/engagement/requestView';
import { QuoteActions, useRequestActions } from '../../../src/features/engagement/BuyerRequestCard';
import { en } from '../../../src/i18n/en';

function Timeline({ steps }: { steps: Step[] }) {
  const t = useTheme();
  const c = t.colors;
  return (
    <View testID="request-timeline">
      {steps.map((st, i) => {
        const dot = st.state === 'done' ? c.primary : st.state === 'current' ? c.dealAmber : st.state === 'failed' ? c.error : c.border;
        const last = i === steps.length - 1;
        return (
          <View key={i} style={styles.stepRow} testID={`step-${st.state}`}>
            <View style={{ alignItems: 'center', width: 20 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: st.state === 'todo' ? c.surface : dot, borderWidth: 2, borderColor: dot, marginTop: 3 }} />
              {!last ? <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: c.border }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : t.spacing.md, gap: 2 }}>
              <Text variant="label" weight={st.state === 'current' ? '700' : '500'} color={st.state === 'todo' ? 'textMuted' : 'textPrimary'}>{st.label}</Text>
              {st.at ? <Text variant="caption" color="textSecondary">{formatIstRelative(st.at)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={[styles.detailRow, { paddingVertical: t.spacing.xs, gap: t.spacing.md }]}>
      <Text variant="bodySmall" color="textSecondary">{label}</Text>
      <Text variant="bodySmall" weight="600" style={{ flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

/** B-12a: one request — status block, price and answer buttons, timeline, details, cancel. */
export default function RequestDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({ queryKey: ['eng', 'my-requests'], queryFn: () => myRequests(), refetchInterval: 60_000 });
  const actions = useRequestActions(id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const r = q.data?.find((x) => x.id === id);
  const header = <TopAppBar title={en.req.detailTitle} onBack={() => router.back()} />;
  if (q.isLoading) return <Screen header={header}><SkeletonBlock kind="list" count={3} /></Screen>;
  if (!r) {
    return (
      <Screen header={header}>
        <EmptyState illustration="list" title={q.isError ? en.req.loadError : en.errors.request_not_found} body={en.errors.unknown} actionLabel={en.common.retry} onAction={() => q.refetch()} testID="request-missing" />
      </Screen>
    );
  }
  const v = buyerRequestView(r);
  const n = firstName(r.vendor_name);
  return (
    <Screen
      header={header}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      footer={
        v.needsReply ? <QuoteActions id={r.id} size="xl" /> : v.canCancel ? (
          <Button label={r.status === 'accepted' ? en.req.cancelOrder : en.req.cancelRequest} variant="destructive" loading={actions.busy === 'cancel'} onPress={() => setConfirmCancel(true)} testID="cancel-request" />
        ) : undefined
      }
    >
      <View style={{ gap: t.spacing.lg }} testID={`request-detail-${r.status}`}>
        <View style={[styles.row, { gap: t.spacing.md }]}>
          <ItemArt name={r.item_name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="cardTitle">{r.item_name}</Text>
            {r.qty ? <Text color="textSecondary">{r.qty}</Text> : null}
            <StatusPill status={v.pill.status} label={v.pill.label} />
          </View>
        </View>

        <RequestStatusBlock tone={v.tone} headline={v.headline} detail={v.detail} large />

        {v.price ? (
          <Card tint={v.needsReply ? 'amber' : 'primary'} testID="detail-price">
            <Text variant="bodySmall" color="textSecondary">{en.req.approxPrice}</Text>
            <Text variant="numberLarge">{v.price}</Text>
            <Text variant="caption" color="textSecondary">{en.req.priceNote}</Text>
          </Card>
        ) : null}

        {actions.error ? <Banner kind="error" message={actions.error} /> : null}

        <View style={{ gap: t.spacing.sm }}>
          <SectionLabel>{en.req.detailTitle}</SectionLabel>
          <Card>
            <Timeline steps={requestSteps(r)} />
          </Card>
        </View>

        <Card>
          <DetailRow label={en.req.vendorLabel} value={r.vendor_name} />
          <DetailRow label={en.req.deliveryLabel} value={en.req.atGate(slotDayLabel(r.slot_start), slotWindowLabel(r.slot_start, r.slot_end), r.gate_name)} />
          <DetailRow label={en.req.societyLabel} value={shortSociety(r.society_name)} />
          {r.qty ? <DetailRow label={en.req.qtyLabel} value={r.qty} /> : null}
          {r.note ? <DetailRow label={en.req.noteLabel} value={`“${r.note}”`} /> : null}
        </Card>
      </View>
      <Dialog
        visible={confirmCancel}
        title={en.req.cancelTitle}
        body={en.req.cancelBody(n)}
        confirmLabel={r.status === 'accepted' ? en.req.cancelOrder : en.req.cancelRequest}
        cancelLabel={en.req.keep}
        kind="destructive"
        onConfirm={async () => {
          setConfirmCancel(false);
          await actions.cancel();
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  stepRow: { flexDirection: 'row', gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
