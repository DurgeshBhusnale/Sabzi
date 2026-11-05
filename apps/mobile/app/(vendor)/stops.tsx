import { useState } from 'react';
import { Linking, View } from 'react-native';
import { formatTimeWindow, SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Card, Dialog, EmptyState, Screen, SegmentedControl, SkeletonBlock, Snackbar, StopRow, Text, Toggle, TopAppBar } from '../../src/ui';
import { stopPhase, type TodayStop } from '../../src/features/vendor/arrival';
import { skipStop, unskipStop } from '../../src/features/vendor/api';
import { useInvalidateVendor, useStopsToday, useStopsWeek, vendorKeys } from '../../src/features/vendor/hooks';
import { en } from '../../src/i18n/en';

function daysLabel(days: number[]): string {
  const names = en.vendor.days;
  const sorted = [...days].sort();
  if (sorted.length === 7) return 'Daily';
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1]! + 1);
  if (contiguous && sorted.length > 2) return `${names[sorted[0]! - 1]}–${names[sorted[sorted.length - 1]! - 1]}`;
  return sorted.map((d) => names[d - 1]).join(', ');
}

/** V-12: Today / This week; "Not going today" with confirm; empty before verification. */
export default function VendorStops() {
  const t = useTheme();
  const [tab, setTab] = useState<'today' | 'week'>('today');
  const today = useStopsToday();
  const week = useStopsWeek();
  const invalidate = useInvalidateVendor();
  const [confirm, setConfirm] = useState<TodayStop | null>(null);
  const [toast, setToast] = useState<{ msg: string; stopId: string } | null>(null);

  const hasNoStops = !week.isLoading && (week.data ?? []).length === 0;
  return (
    <Screen header={<TopAppBar title={en.vendor.myStops} />} refreshing={today.isRefetching} onRefresh={() => invalidate(vendorKeys.stops, vendorKeys.week)}>
      {hasNoStops ? (
        <EmptyState illustration="pin" title={en.vendor.noStopsTitle} body={en.vendor.noStopsBody} actionLabel={en.common.callSupport} onAction={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="no-stops" />
      ) : (
        <>
          <SegmentedControl value={tab} onChange={setTab} options={[{ value: 'today', label: en.vendor.today }, { value: 'week', label: en.vendor.thisWeek }]} />
          {tab === 'today' ? (
            today.isLoading ? (
              <SkeletonBlock kind="list" count={2} />
            ) : (
              (today.data ?? []).map((s) => (
                <Card key={s.stopId} style={{ padding: 0, overflow: 'hidden' }}>
                  <StopRow society={s.societyName} gate={s.gateName} windowStart={s.windowStart} windowEnd={s.windowEnd} followers={s.followers} state={stopPhase(s)} />
                  <View style={{ paddingHorizontal: t.spacing.md }}>
                    <Toggle
                      testID={`skip-${s.stopId}`}
                      label={s.skipped ? en.stops.notGoing : en.vendor.notGoingToday}
                      value={s.skipped}
                      disabled={!!s.arrivedAt}
                      onChange={async (v) => {
                        if (v) setConfirm(s);
                        else {
                          await unskipStop(s.stopId);
                          await invalidate(vendorKeys.stops);
                        }
                      }}
                    />
                  </View>
                </Card>
              ))
            )
          ) : (
            (week.data ?? []).map((w) => (
              <Card key={w.stopId} style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' }}>
                <Text weight="700" color="primary" style={{ width: 88 }}>{daysLabel(w.days)}</Text>
                <View style={{ flex: 1 }}>
                  <Text weight="600">{`${w.societyName} · ${w.gateName}`}</Text>
                  <Text variant="bodySmall" color="textSecondary">{formatTimeWindow(w.windowStart, w.windowEnd)}</Text>
                </View>
              </Card>
            ))
          )}
          <Button label={en.vendor.askChange} variant="secondary" onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} />
        </>
      )}
      {toast ? (
        <Snackbar
          kind="success"
          message={toast.msg}
          actionLabel={en.vendor.undo}
          onAction={async () => {
            await unskipStop(toast.stopId);
            setToast(null);
            await invalidate(vendorKeys.stops);
          }}
          undoSeconds={5}
          onTimeout={() => setToast(null)}
        />
      ) : null}
      <View style={{ height: t.heights.fab + t.spacing.xl }} />
      <Dialog
        visible={!!confirm}
        kind="destructive"
        title={confirm ? en.vendor.notGoingQ(confirm.societyName) : ''}
        body={confirm ? en.vendor.notGoingBody(confirm.followers) : ''}
        confirmLabel={en.vendor.yesTell}
        cancelLabel={en.common.cancel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const s = confirm!;
          setConfirm(null);
          const r = await skipStop(s.stopId);
          setToast({ msg: en.vendor.followersTold(r.followers), stopId: s.stopId });
          await invalidate(vendorKeys.stops);
        }}
      />
    </Screen>
  );
}
