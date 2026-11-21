import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { formatIstTime, formatPrice, shortSociety, type DeliveryOrder, type MissReason } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, RequestStatusBlock, Snackbar, Text } from '../../ui';
import { AppErrorException } from '../../lib/errors';
import { en } from '../../i18n/en';
import type { DeliveryOutcome } from './api';

export type MarkFn = (ids: string[], outcome: DeliveryOutcome, reason?: MissReason) => Promise<void>;

const REASONS: MissReason[] = ['buyer_not_there', 'vendor_unavailable', 'other'];

/** One buyer's order on one visit: items, then Delivered / Not delivered (reason in one tap), or the recorded result. */
function OrderRow({ o, enabled, busy, onMark }: { o: DeliveryOrder; enabled: boolean; busy: boolean; onMark: MarkFn }) {
  const t = useTheme();
  const [asking, setAsking] = useState(false);
  return (
    <Card style={[{ gap: t.spacing.sm }, o.state === 'pending' && enabled ? { borderColor: t.colors.dealAmber, borderWidth: 2 } : null]} testID={`order-${o.buyer}`}>
      <View style={{ gap: 2 }}>
        <Text variant="label" weight="700">{`${o.buyer} · ${shortSociety(o.society)}`}</Text>
        {o.items.map((i) => (
          <View key={i.id} style={styles.itemRow}>
            <Text variant="bodySmall">{i.qty ? `${i.name} · ${i.qty}` : i.name}</Text>
            {i.price != null ? <Text variant="bodySmall" color="textSecondary">{`about ${formatPrice(i.price, i.unit ?? 'kg')}`}</Text> : null}
          </View>
        ))}
      </View>

      {o.state === 'delivered' ? (
        <RequestStatusBlock tone="success" headline={en.req.deliveredAt(o.delivered_at ? formatIstTime(o.delivered_at) : '')} testID={`delivered-${o.buyer}`} />
      ) : o.state === 'not_delivered' ? (
        <RequestStatusBlock tone="error" headline={en.req.notDeliveredBecause(en.req.reason[o.missed_reason ?? 'other']!)} testID={`not-delivered-${o.buyer}`} />
      ) : null}

      {!enabled ? null : o.state !== 'pending' ? (
        <Button label={en.req.change} variant="tertiary" fullWidth={false} disabled={busy} onPress={() => onMark(o.ids, 'reset')} testID={`change-${o.buyer}`} />
      ) : asking ? (
        <View style={{ gap: t.spacing.xs }} testID={`reasons-${o.buyer}`}>
          <Text variant="bodySmall" weight="600">{en.req.whyNot}</Text>
          {REASONS.map((r) => (
            <Button key={r} size="xl" variant="secondary" label={en.req.reason[r]!} disabled={busy} onPress={async () => { await onMark(o.ids, 'not_delivered', r); setAsking(false); }} testID={`reason-${r}-${o.buyer}`} />
          ))}
          <Button label={en.common.cancel} variant="tertiary" fullWidth={false} onPress={() => setAsking(false)} />
        </View>
      ) : (
        <View style={[styles.row, { gap: t.spacing.xs }]}>
          <View style={{ flex: 1 }}>
            <Button size="xl" label={en.req.delivered} loading={busy} disabled={busy} onPress={() => onMark(o.ids, 'delivered')} testID={`deliver-${o.buyer}`} />
          </View>
          <View style={{ flex: 1 }}>
            <Button size="xl" label={en.req.notDelivered} variant="destructive" disabled={busy} onPress={() => setAsking(true)} testID={`not-deliver-${o.buyer}`} />
          </View>
        </View>
      )}
    </Card>
  );
}

/**
 * Delivery checklist for one visit (Confirmed list tab and the "Hand over these orders?" sheet).
 * Every mark can be undone for 5 s from the snackbar, and changed until the end of the next day.
 */
export function DeliveryOrders({ orders, enabled, opensAt, onMark, testID = 'delivery-orders' }: { orders: DeliveryOrder[]; enabled: boolean; opensAt?: string; onMark: MarkFn; testID?: string }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ ids: string[]; message: string } | null>(null);
  const pending = orders.filter((o) => o.state === 'pending');
  const mark: MarkFn = async (ids, outcome, reason) => {
    setBusy(true);
    setError(null);
    try {
      await onMark(ids, outcome, reason);
      if (outcome === 'delivered') setUndo({ ids, message: en.req.markedDelivered(orders.filter((o) => o.ids.some((id) => ids.includes(id))).length) });
      else if (outcome === 'not_delivered') setUndo({ ids, message: en.req.markedNot });
      else setUndo(null);
    } catch (e) {
      setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: t.spacing.sm }} testID={testID}>
      {!enabled && opensAt ? <Banner kind="info" message={en.req.markFrom(opensAt)} /> : null}
      {enabled && pending.length > 1 ? (
        <Button size="xl" label={en.req.markAll(pending.length)} loading={busy} disabled={busy} onPress={() => mark(pending.flatMap((o) => o.ids), 'delivered')} testID="mark-all-delivered" />
      ) : null}
      {orders.map((o) => <OrderRow key={o.ref} o={o} enabled={enabled} busy={busy} onMark={mark} />)}
      {error ? <Banner kind="error" message={error} /> : null}
      {undo ? (
        <Snackbar
          key={undo.ids.join(',') + undo.message}
          kind="success"
          message={undo.message}
          actionLabel={en.req.undo}
          undoSeconds={5}
          onAction={() => { const ids = undo.ids; setUndo(null); void mark(ids, 'reset'); }}
          onTimeout={() => setUndo(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
