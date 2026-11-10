import { useState } from 'react';
import { Linking, Switch, View } from 'react-native';
import { formatTimeWindow, SUPPORT_PHONE } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, Dialog, EmptyState, Screen, SegmentedControl, SheetBody, SkeletonBlock, Snackbar, Text, TopAppBar } from '../../src/ui';
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

const clockShort = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h! % 12 === 0 ? 12 : h! % 12}:${String(m).padStart(2, '0')}`;
};

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
    <Screen tone="forest" header={<TopAppBar tone="forest" title={en.vendor.myStops} />} refreshing={today.isRefetching} onRefresh={() => invalidate(vendorKeys.stops, vendorKeys.week)}>
      <SheetBody>
      {hasNoStops ? (
        <EmptyState illustration="pin" title={en.vendor.noStopsTitle} body={en.vendor.noStopsBody} actionLabel={en.common.callSupport} onAction={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)} testID="no-stops" />
      ) : (
        <>
          <SegmentedControl value={tab} onChange={setTab} options={[{ value: 'today', label: en.vendor.today }, { value: 'week', label: en.vendor.thisWeek }]} />
          {tab === 'today' ? (
            today.isLoading ? (
              <SkeletonBlock kind="list" count={2} />
            ) : (
              (today.data ?? []).map((s, i, all) => {
                const phase = stopPhase(s);
                return (
                  <View key={s.stopId} testID={`stop-row-${phase}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 72, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: t.colors.border, opacity: phase === 'done' ? 0.6 : 1 }}>
                    <Text variant="price" color="textSecondary" style={{ width: 64 }}>{clockShort(s.windowStart)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="label">{s.societyName}</Text>
                      <Text variant="caption" weight="400" color={s.skipped ? 'error' : 'textSecondary'}>
                        {s.skipped ? en.stops.notGoing : `${s.gateName} · ${en.stops.followers(s.followers)}`}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text variant="caption" weight="400" color="textSecondary">{en.vendor.notGoingToday}</Text>
                      <Switch
                        testID={`skip-${s.stopId}`}
                        accessibilityLabel={`${en.vendor.notGoingToday}, ${s.societyName}`}
                        value={s.skipped}
                        disabled={!!s.arrivedAt}
                        trackColor={{ true: t.colors.error, false: t.scheme === 'dark' ? t.colors.border : '#CFCDBF' }}
                        thumbColor={t.colors.surface}
                        onValueChange={async (v) => {
                          if (v) setConfirm(s);
                          else {
                            await unskipStop(s.stopId);
                            await invalidate(vendorKeys.stops);
                          }
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )
          ) : (
            (week.data ?? []).map((w, i, all) => (
              <View key={w.stopId} style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'center', minHeight: 64, borderBottomWidth: i === all.length - 1 ? 0 : 1, borderBottomColor: t.colors.border }}>
                <Text variant="label" color="accent" style={{ width: 88 }}>{daysLabel(w.days)}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="label">{`${w.societyName} · ${w.gateName}`}</Text>
                  <Text variant="caption" weight="400" color="textSecondary">{formatTimeWindow(w.windowStart, w.windowEnd)}</Text>
                </View>
              </View>
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
      </SheetBody>
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
