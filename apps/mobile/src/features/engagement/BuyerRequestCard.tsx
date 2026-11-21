import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Banner, Button, RequestCard } from '../../ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AppErrorException } from '../../lib/errors';
import { en } from '../../i18n/en';
import { cancelRequest, respondToQuote, type MyRequest } from './api';
import { buyerRequestView } from './requestView';

/** Confirm order / Not now / Cancel, shared by the card and the detail screen. */
export function useRequestActions(id: string) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<'confirm' | 'decline' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = async (kind: 'confirm' | 'decline' | 'cancel') => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'cancel') await cancelRequest(id);
      else await respondToQuote(id, kind === 'confirm');
    } catch (e) {
      setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
    } finally {
      setBusy(null);
      await qc.invalidateQueries({ queryKey: ['eng', 'my-requests'] });
    }
  };
  return { busy, error, confirm: () => run('confirm'), decline: () => run('decline'), cancel: () => run('cancel') };
}

/** The two answers to a vendor's price: a full-width primary "Confirm order" and a quieter "Not now". */
export function QuoteActions({ id, size = 'default' }: { id: string; size?: 'default' | 'xl' }) {
  const t = useTheme();
  const a = useRequestActions(id);
  return (
    <View style={{ gap: t.spacing.xs }}>
      <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
        <View style={{ flex: 2 }}>
          <Button size={size} label={en.req.confirmOrder} loading={a.busy === 'confirm'} disabled={!!a.busy} onPress={a.confirm} testID={`confirm-${id}`} />
        </View>
        <View style={{ flex: 1 }}>
          <Button size={size} label={en.req.notNow} variant="secondary" loading={a.busy === 'decline'} disabled={!!a.busy} onPress={a.decline} testID={`decline-${id}`} />
        </View>
      </View>
      {a.error ? <Banner kind="error" message={a.error} /> : null}
    </View>
  );
}

export function BuyerRequestCard({ request: r, onPress, now }: { request: MyRequest; onPress: () => void; now?: Date }) {
  const v = buyerRequestView(r, now);
  return (
    <RequestCard
      testID={`request-${r.id}`}
      item={r.item_name}
      qty={r.qty}
      vendorName={r.vendor_name}
      when={v.when}
      pill={v.pill}
      tone={v.tone}
      headline={v.headline}
      detail={v.detail}
      price={v.price}
      priceLabel={en.req.approxPrice}
      priceNote={v.needsReply ? en.req.priceNote : undefined}
      actions={v.needsReply ? <QuoteActions id={r.id} /> : undefined}
      onPress={onPress}
    />
  );
}
