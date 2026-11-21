import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { cutoffPhrase, formatIstTime, formatPrice, LIMITS, PRICE_UNITS, shortSociety, slotDayLabel, slotWindowLabel, UNIT_LABELS, type PriceUnit, type RequestGroup, type SlotGroup } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Chip, Dialog, EmptyState, ItemArt, RequestStatusBlock, SegmentedControl, SkeletonBlock, Text } from '../../ui';
import { en } from '../../i18n/en';
import { DeliveryOrders, type MarkFn } from './DeliveryOrders';

export type VendorTab = 'requests' | 'confirmed';
export type AnswerInput = { slot: SlotGroup; group: RequestGroup; status: 'will_bring' | 'cant_bring'; price?: number; unit?: PriceUnit };

const STEPS = [-5, -1, 1, 5] as const;

/** Compact price box for a request card: −5 −1 ₹40 +1 +5, unit chips only for free-text items. */
function PriceBox({ price, unit, onChange, onUnit, showUnits, testID }: { price: number; unit: PriceUnit; onChange: (p: number) => void; onUnit: (u: PriceUnit) => void; showUnits: boolean; testID: string }) {
  const t = useTheme();
  const c = t.colors;
  return (
    <View style={{ gap: t.spacing.xs }} testID={testID}>
      <Text variant="bodySmall" weight="600">{en.req.vPriceLabel(UNIT_LABELS[unit])}</Text>
      <View style={[styles.row, { gap: t.spacing.xs }]}>
        {STEPS.slice(0, 2).map((d) => (
          <Pressable key={d} testID={`${testID}-step${d}`} accessibilityRole="button" accessibilityLabel={`Subtract ${-d} rupees`} onPress={() => onChange(Math.max(LIMITS.priceMin, price + d))}
            style={[styles.step, { minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, borderRadius: t.radius.button, backgroundColor: c.surface2 }]}>
            <Text weight="600">{`${d}`}</Text>
          </Pressable>
        ))}
        <View style={[styles.value, { minHeight: t.layout.minTouch, borderRadius: t.radius.button, borderColor: c.primary, borderWidth: 2 }]}>
          <Text variant="price" weight="600" testID={`${testID}-value`}>{`₹${price}`}</Text>
        </View>
        {STEPS.slice(2).map((d) => (
          <Pressable key={d} testID={`${testID}-step+${d}`} accessibilityRole="button" accessibilityLabel={`Add ${d} rupees`} onPress={() => onChange(Math.min(LIMITS.priceMax, price + d))}
            style={[styles.step, { minWidth: t.layout.minTouch, minHeight: t.layout.minTouch, borderRadius: t.radius.button, backgroundColor: c.surface2 }]}>
            <Text weight="600">{`+${d}`}</Text>
          </Pressable>
        ))}
      </View>
      {showUnits ? (
        <View style={[styles.row, { gap: t.spacing.xs, flexWrap: 'wrap' }]}>
          {PRICE_UNITS.map((u) => <Chip key={u} label={UNIT_LABELS[u]} selected={u === unit} onPress={() => onUnit(u)} />)}
        </View>
      ) : null}
      <Text variant="caption" color="textSecondary">{en.req.vPriceHint}</Text>
    </View>
  );
}

function CountChips({ g }: { g: RequestGroup }) {
  const t = useTheme();
  const items: { key: string; label: string; bg: 'primaryTint' | 'dealAmberTint' | 'surface2'; fg: 'onPrimaryTint' | 'dealAmberText' | 'textSecondary' }[] = [];
  if (g.counts.waiting) items.push({ key: 'waiting', label: en.req.counts.waiting(g.counts.waiting), bg: 'dealAmberTint', fg: 'dealAmberText' });
  if (g.counts.confirmed) items.push({ key: 'confirmed', label: en.req.counts.confirmed(g.counts.confirmed), bg: 'primaryTint', fg: 'onPrimaryTint' });
  if (g.counts.quoted) items.push({ key: 'quoted', label: en.req.counts.quoted(g.counts.quoted), bg: 'surface2', fg: 'textSecondary' });
  if (g.counts.declined) items.push({ key: 'declined', label: en.req.counts.declined(g.counts.declined), bg: 'surface2', fg: 'textSecondary' });
  if (g.counts.expired) items.push({ key: 'expired', label: en.req.counts.expired(g.counts.expired), bg: 'surface2', fg: 'textSecondary' });
  if (!items.length) return null;
  return (
    <View style={[styles.row, { gap: t.spacing.xs, flexWrap: 'wrap' }]} testID="vr-counts">
      {items.map((i) => (
        <View key={i.key} style={{ backgroundColor: t.colors[i.bg], borderRadius: t.radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text variant="caption" color={i.fg}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** One item on one visit: who asked, notes, and the vendor's answer. */
function ItemRequestCard({ slot, g, onAnswer }: { slot: SlotGroup; g: RequestGroup; onAnswer: (a: AnswerInput) => Promise<void> }) {
  const t = useTheme();
  const [price, setPrice] = useState<number>(g.price ?? 40);
  const [unit, setUnit] = useState<PriceUnit>(g.unit);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(false);
  const [busy, setBusy] = useState<'accept' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeny, setConfirmDeny] = useState(false);
  const isFree = g.key.startsWith('free:');
  const showEditor = g.decision === 'pending' || editing;
  const run = async (status: 'will_bring' | 'cant_bring') => {
    setBusy(status === 'will_bring' ? 'accept' : 'deny');
    setError(null);
    try {
      await onAnswer({ slot, group: g, status, ...(status === 'will_bring' ? { price, unit } : {}) });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.unknown);
    } finally {
      setBusy(null);
    }
  };
  const deny = () => (g.counts.confirmed > 0 ? setConfirmDeny(true) : run('cant_bring'));
  return (
    <Card style={[{ gap: t.spacing.sm }, g.decision === 'pending' ? { borderColor: t.colors.dealAmber, borderWidth: 2 } : null]} testID={`vr-group-${g.name}`}>
      <View style={[styles.row, { gap: t.spacing.sm }]}>
        <ItemArt name={g.name} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" weight="700">{g.totalLabel ? `${g.name} · ${g.totalLabel}` : g.name}</Text>
          <Text variant="bodySmall" color="textSecondary">{`${en.req.people(g.count)} · ${g.societies.map(shortSociety).join(', ')}`}</Text>
        </View>
      </View>
      <CountChips g={g} />
      {g.notes.length ? (
        <Button label={notes ? en.eng.hideNotes : `${en.eng.showNotes} (${g.notes.length})`} variant="tertiary" fullWidth={false} onPress={() => setNotes(!notes)} testID={`notes-${g.name}`} />
      ) : null}
      {notes
        ? g.notes.map((n, i) => (
            <Text key={i} variant="bodySmall" color="textSecondary">{`${n.buyer} · ${shortSociety(n.society)}${n.qty ? ` · ${n.qty}` : ''}: “${n.note}”`}</Text>
          ))
        : null}

      {g.decision === 'accepted' && !editing ? (
        <RequestStatusBlock tone="success" headline={en.req.acceptedAt(formatPrice(g.price ?? price, g.unit))} testID="vr-accepted" />
      ) : null}
      {g.decision === 'denied' && !editing ? <RequestStatusBlock tone="error" headline={en.req.denied} testID="vr-denied" /> : null}

      {showEditor ? <PriceBox price={price} unit={unit} onChange={setPrice} onUnit={setUnit} showUnits={isFree} testID={`price-${g.name}`} /> : null}

      {showEditor ? (
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          <View style={{ flex: 1 }}>
            <Button size="xl" label={g.decision === 'accepted' ? en.req.updatePrice : en.req.accept} loading={busy === 'accept'} disabled={!!busy} onPress={() => run('will_bring')} testID={`accept-${g.name}`} />
          </View>
          <View style={{ flex: 1 }}>
            <Button size="xl" label={en.req.deny} variant="destructive" loading={busy === 'deny'} disabled={!!busy} onPress={deny} testID={`deny-${g.name}`} />
          </View>
        </View>
      ) : g.decision === 'accepted' ? (
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          <View style={{ flex: 1 }}>
            <Button label={en.req.updatePrice} variant="secondary" onPress={() => setEditing(true)} testID={`edit-${g.name}`} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={en.req.deny} variant="destructive" loading={busy === 'deny'} disabled={!!busy} onPress={deny} testID={`deny-${g.name}`} />
          </View>
        </View>
      ) : (
        <Button label={en.req.undoDeny} variant="secondary" onPress={() => setEditing(true)} testID={`undo-deny-${g.name}`} />
      )}
      {error ? <Banner kind="error" message={error} /> : null}
      <Dialog
        visible={confirmDeny}
        kind="destructive"
        title={en.req.denyConfirmTitle(g.counts.confirmed)}
        body={en.req.denyConfirmBody}
        confirmLabel={en.req.denyAnyway}
        cancelLabel={en.req.keep}
        onConfirm={() => { setConfirmDeny(false); void run('cant_bring'); }}
        onCancel={() => setConfirmDeny(false)}
      />
    </Card>
  );
}

function SlotHeader({ slot, now, sub }: { slot: SlotGroup; now: Date; sub?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2, marginTop: t.spacing.xs }} testID={`vr-slot-${slot.key}`}>
      <Text variant="sectionTitle">{slotDayLabel(slot.slot_start, now)}</Text>
      <Text variant="bodySmall" color="textSecondary">
        {`${slotWindowLabel(slot.slot_start, slot.slot_end)}${slot.gate_name ? ` · ${slot.gate_name}` : ''} · ${slot.societies.map(shortSociety).join(', ')}`}
      </Text>
      {sub ? <Text variant="caption" color="dealAmberText">{sub}</Text> : null}
    </View>
  );
}

/** Short label for a visit filter chip: "Green Park · Tomorrow morning" */
const visitLabel = (s: SlotGroup, now: Date) => `${s.societies.map(shortSociety).join(', ')} · ${slotDayLabel(s.slot_start, now)}`;

/**
 * Confirmed list: per visit, what to carry and the orders to close. Filter by visit (society + day); the default is
 * the first visit that can be marked now and still has orders to mark. Delivered / Not delivered work here any time
 * in the delivery window, whether or not the vendor tapped "Leaving soon".
 */
function ConfirmedList({ slots, now, onMark }: { slots: SlotGroup[]; now: Date; onMark: MarkFn }) {
  const t = useTheme();
  const withOrders = slots.filter((s) => s.orders.length > 0);
  const firstOpen = withOrders.find((s) => s.deliverable && s.orders.some((o) => o.state === 'pending'));
  const [picked, setPicked] = useState<string | null>(null);
  const filter = picked ?? firstOpen?.key ?? 'all';
  if (!withOrders.length) {
    return <EmptyState illustration="list" art="noRequests" title={en.req.cNone} body={en.req.cNoneBody} testID="vc-empty" />;
  }
  const shown = filter === 'all' ? withOrders : withOrders.filter((s) => s.key === filter);
  return (
    <View style={{ gap: t.spacing.md }} testID="vendor-confirmed">
      <Text variant="bodySmall" color="textSecondary">{en.req.cSub}</Text>
      <View style={[styles.row, { gap: t.spacing.xs, flexWrap: 'wrap' }]} testID="vc-filter">
        <Chip label={en.req.filterAll} selected={filter === 'all'} onPress={() => setPicked('all')} testID="vc-filter-all" />
        {withOrders.map((s) => {
          const left = s.deliverable ? s.orders.filter((o) => o.state === 'pending').length : 0;
          return <Chip key={s.key} label={left ? `${visitLabel(s, now)} (${left})` : visitLabel(s, now)} selected={filter === s.key} onPress={() => setPicked(s.key)} testID={`vc-filter-${s.key}`} />;
        })}
      </View>
      {shown.map((s) => {
        const items = s.items.filter((g) => g.counts.confirmed > 0);
        return (
          <View key={s.key} style={{ gap: t.spacing.sm }}>
            <SlotHeader slot={s} now={now} />
            <Text variant="sectionLabel" color="textSecondary">{en.req.carryTitle}</Text>
            <Card style={{ gap: t.spacing.xs }}>
              {items.map((g, i) => (
                <View key={g.key} style={[styles.row, { gap: t.spacing.sm }, i ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.divider, paddingTop: t.spacing.xs } : null]} testID={`vc-item-${g.name}`}>
                  <ItemArt name={g.name} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight="700">{g.name}</Text>
                    <Text variant="bodySmall" color="textSecondary">{`${en.req.cBuyers(g.counts.confirmed)}${g.price != null ? ` · ${en.req.cAt(formatPrice(g.price, g.unit))}` : ''}`}</Text>
                  </View>
                  {g.confirmedTotal ? <Text variant="price" weight="600" testID="vc-total">{g.confirmedTotal}</Text> : null}
                </View>
              ))}
            </Card>
            <Text variant="sectionLabel" color="textSecondary">{en.req.ordersTitle}</Text>
            <DeliveryOrders testID={`vc-orders-${s.key}`} orders={s.orders} enabled={s.deliverable} opensAt={formatIstTime(new Date(Date.parse(s.slot_start) - 3_600_000))} onMark={onMark} />
          </View>
        );
      })}
    </View>
  );
}

/** V-13 (request flow v2): Requests tab (accept with a price / deny, per item per visit) and Confirmed list tab. */
export function VendorRequestsView({
  slots,
  loading,
  error,
  now = new Date(),
  tab,
  onTab,
  onAnswer,
  onMark,
  onShareQr,
  onRetry,
}: {
  slots: SlotGroup[] | undefined;
  loading: boolean;
  error?: boolean;
  now?: Date;
  tab: VendorTab;
  onTab: (t: VendorTab) => void;
  onAnswer: (a: AnswerInput) => Promise<void>;
  onMark: MarkFn;
  onShareQr: () => void;
  onRetry?: () => void;
}) {
  const t = useTheme();
  if (loading) return <SkeletonBlock kind="list" count={3} />;
  if (!slots) {
    return <EmptyState illustration="list" title={en.req.loadError} body={en.errors.unknown} actionLabel={en.common.retry} onAction={onRetry} testID="vr-error" />;
  }
  // Requests tab: only visits still ahead (finished visits stay in the Confirmed list until the delivery window ends).
  const upcoming = slots.filter((s) => Date.parse(s.slot_end) > now.getTime());
  const toAnswer = upcoming.reduce((n, s) => n + s.items.filter((g) => g.decision === 'pending').length, 0);
  const toMark = slots.reduce((n, s) => n + (s.deliverable ? s.orders.filter((o) => o.state === 'pending').length : 0), 0);
  const confirmed = slots.reduce((n, s) => n + s.orders.length, 0);
  return (
    <View style={{ gap: t.spacing.md }} testID="vendor-requests">
      <SegmentedControl
        testID="vr-tabs"
        value={tab}
        onChange={onTab}
        options={[
          { value: 'requests', label: toAnswer ? `${en.req.tabRequests} (${toAnswer})` : en.req.tabRequests },
          { value: 'confirmed', label: toMark ? `${en.req.tabConfirmed} (${en.req.pendingCount(toMark)})` : confirmed ? `${en.req.tabConfirmed} (${confirmed})` : en.req.tabConfirmed },
        ]}
      />
      {error ? <Banner kind="error" message={en.req.loadError} /> : null}
      {tab === 'confirmed' ? (
        <ConfirmedList slots={slots} now={now} onMark={onMark} />
      ) : upcoming.length === 0 ? (
        <EmptyState illustration="list" art="noRequests" title={en.req.vNone} body={en.req.vNoneBody} actionLabel={en.eng.vrShareQr} onAction={onShareQr} testID="vr-empty" />
      ) : (
        <>
          <Text variant="bodySmall" color="textSecondary">{en.req.vSub}</Text>
          {upcoming.map((s) => (
            <View key={s.key} style={{ gap: t.spacing.sm }}>
              <SlotHeader slot={s} now={now} sub={s.items.some((g) => g.decision === 'pending') ? en.req.vReplyBy(cutoffPhrase(s.slot_start, now)) : undefined} />
              {s.items.map((g) => <ItemRequestCard key={`${s.key}:${g.key}`} slot={s} g={g} onAnswer={onAnswer} />)}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  step: { alignItems: 'center', justifyContent: 'center' },
  value: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buyerRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth },
});
