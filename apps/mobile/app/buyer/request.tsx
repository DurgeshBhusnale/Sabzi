import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cutoffPhrase, REQUEST_QTY_CHIPS, slotDayLabel, slotPhrase, slotWindowLabel, type RequestSlot } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, Chip, EmptyState, ItemTile, Screen, SkeletonBlock, SlotTile, Text, TextInput, TopAppBar } from '../../src/ui';
import { createRequest, itemsList, requestSlots } from '../../src/features/engagement/api';
import { usePrimarySociety } from '../../src/features/buyer/hooks';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/**
 * B-11 (request flow v2): pick one of the vendor's next visits (slot tiles, the next one pre-selected), the item,
 * quantity and note. States: loading, no open visits, error, sent, limit reached, visit just closed.
 */
export default function RequestItem() {
  const t = useTheme();
  const { vendorId, name = '' } = useLocalSearchParams<{ vendorId: string; name: string }>();
  const { primary } = usePrimarySociety();
  const items = useQuery({ queryKey: ['items'], queryFn: () => itemsList(), staleTime: 3_600_000 });
  const slots = useQuery({ queryKey: ['eng', 'slots', vendorId, primary?.id], queryFn: () => requestSlots(vendorId, primary!.id), enabled: !!primary, refetchInterval: 60_000 });
  const [slotKey, setSlotKey] = useState<string | null>(null);
  const keyOf = (s: RequestSlot) => `${s.stop_id}|${s.date}`;
  // The next visit is pre-selected; if the chosen one closes while the screen is open, fall back to the next.
  const slot = slots.data?.find((s) => keyOf(s) === slotKey) ?? slots.data?.[0] ?? null;
  const [sentFor, setSentFor] = useState<string>('');
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [freeText, setFreeText] = useState<string | null>(null);
  const [qty, setQty] = useState<string | null>(null);
  const [customQty, setCustomQty] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState<'form' | 'sending' | 'sent' | 'limit'>('form');
  const [error, setError] = useState<string | null>(null);
  const first = name.split(' ')[0] ?? name;
  const filtered = useMemo(() => (items.data ?? []).filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 24), [items.data, q]);
  const rows: (typeof filtered)[] = [];
  for (let i = 0; i < filtered.length; i += 3) rows.push(filtered.slice(i, i + 3));

  if (state === 'sent') {
    return (
      <Screen header={<TopAppBar onBack={() => router.back()} />}>
        <EmptyState illustration="list" art="success" title={en.eng.sentTitle} body={en.req.sentBody(first, sentFor)} actionLabel={en.common.done} onAction={() => router.back()} testID="request-sent" />
      </Screen>
    );
  }
  if (state === 'limit') {
    return (
      <Screen header={<TopAppBar onBack={() => router.back()} />}>
        <EmptyState illustration="list" title={en.eng.limitTitle} body={en.eng.limitBody} actionLabel={en.eng.myRequests} onAction={() => router.replace('/(buyer)/requests')} testID="request-limit" />
      </Screen>
    );
  }
  if (slots.isLoading || !primary) {
    return (
      <Screen header={<TopAppBar title={en.eng.requestTitle} onBack={() => router.back()} />}>
        <SkeletonBlock kind="list" count={3} />
      </Screen>
    );
  }
  if (slots.isError) {
    return (
      <Screen header={<TopAppBar title={en.eng.requestTitle} onBack={() => router.back()} />}>
        <EmptyState illustration="list" title={en.req.loadError} body={en.errors.unknown} actionLabel={en.common.retry} onAction={() => slots.refetch()} testID="slots-error" />
      </Screen>
    );
  }
  if (!slots.data?.length) {
    return (
      <Screen header={<TopAppBar title={en.eng.requestTitle} onBack={() => router.back()} />}>
        <EmptyState illustration="list" title={en.req.noSlotsTitle} body={en.req.noSlotsBody(first)} actionLabel={en.common.done} onAction={() => router.back()} testID="no-slots" />
      </Screen>
    );
  }
  const ready = !!slot && !!(itemId || (freeText && freeText.trim().length >= 2));
  return (
    <Screen
      header={<TopAppBar title={en.eng.requestTitle} onBack={() => router.back()} />}
      footer={
        <Button
          label={en.eng.send}
          disabled={!ready || !primary}
          loading={state === 'sending'}
          testID="send-request"
          onPress={async () => {
            setState('sending');
            setError(null);
            try {
              await createRequest({ vendor_id: vendorId, society_id: primary!.id, item_id: itemId, free_text: itemId ? null : freeText, qty: qty === 'custom' ? customQty : qty, note, stop_id: slot!.stop_id, for_date: slot!.date });
              setSentFor(slotPhrase(slot!.slot_start));
              track('request_created');
              qc.invalidateQueries({ queryKey: ['eng', 'my-requests'] });
              setState('sent');
            } catch (e) {
              if (e instanceof AppErrorException && e.appError.code === 'request_limit') return setState('limit');
              if (e instanceof AppErrorException && e.appError.code === 'slot_closed') {
                setError(en.req.slotClosed);
                setState('form');
                await slots.refetch();
                return;
              }
              setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
              setState('form');
            }
          }}
        />
      }
    >
      <Text variant="h2">{en.eng.requestFrom(name)}</Text>
      <View style={{ gap: t.spacing.xs }}>
        <Text weight="600">{en.req.whenTitle}</Text>
        <Text variant="bodySmall" color="textSecondary">{en.req.whenHint(first)}</Text>
      </View>
      <View accessibilityRole="radiogroup" style={{ gap: t.spacing.xs }} testID="slot-list">
        {slots.data.map((s) => (
          <SlotTile
            key={keyOf(s)}
            testID={`slot-${s.stop_id}-${s.date}`}
            day={slotDayLabel(s.slot_start)}
            window={`${slotWindowLabel(s.slot_start, `${s.date}T${s.window_end}+05:30`)} · ${s.gate_name}`}
            cutoff={en.req.orderBy(cutoffPhrase(s.cutoff_at))}
            selected={!!slot && keyOf(s) === keyOf(slot)}
            onPress={() => setSlotKey(keyOf(s))}
          />
        ))}
      </View>
      <Text weight="600">{en.eng.whatItem}</Text>
      <TextInput kind="search" placeholder={en.eng.searchItems} value={q} onChangeText={setQ} />
      {items.isLoading ? <SkeletonBlock kind="list" count={2} /> : rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: t.spacing.xs }}>
          {row.map((it) => (
            <ItemTile key={it.id} name={it.name} showSetPrice={false} state={itemId === it.id ? 'selected' : 'unselected'} onPress={() => { setItemId(itemId === it.id ? null : it.id); setFreeText(null); }} />
          ))}
          {Array.from({ length: 3 - row.length }).map((_, k) => <View key={k} style={{ flex: 1 }} />)}
        </View>
      ))}
      <Chip label={en.eng.somethingElse} selected={freeText !== null} onPress={() => { setFreeText(freeText === null ? q : null); setItemId(null); }} testID="something-else" />
      {freeText !== null ? <TextInput label={en.eng.somethingElse} placeholder={en.eng.somethingElsePh} value={freeText} onChangeText={setFreeText} maxChars={40} testID="free-text" /> : null}
      <Text weight="600">{en.eng.howMuch}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
        {REQUEST_QTY_CHIPS.map((c) => <Chip key={c} label={c} selected={qty === c} onPress={() => setQty(qty === c ? null : c)} />)}
        <Chip label={en.eng.custom} selected={qty === 'custom'} onPress={() => setQty(qty === 'custom' ? null : 'custom')} />
      </View>
      {qty === 'custom' ? <TextInput placeholder={en.eng.customPh} value={customQty} onChangeText={setCustomQty} maxChars={20} /> : null}
      <TextInput label={en.eng.note} placeholder={en.eng.notePh} value={note} onChangeText={setNote} maxChars={140} />
      {error ? <Banner kind="error" message={error} /> : null}
    </Screen>
  );
}
