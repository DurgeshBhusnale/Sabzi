import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { REQUEST_QTY_CHIPS } from '@sabzi/shared';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Banner, Button, Chip, EmptyState, ItemTile, Screen, SkeletonBlock, Text, TextInput, TopAppBar } from '../../src/ui';
import { createRequest, itemsList } from '../../src/features/engagement/api';
import { usePrimarySociety } from '../../src/features/buyer/hooks';
import { AppErrorException } from '../../src/lib/errors';
import { track } from '../../src/lib/analytics';
import { en } from '../../src/i18n/en';

/** B-11: item grid + search + "Something else", quantity chips, note; sent and limit-reached states. */
export default function RequestTomorrow() {
  const t = useTheme();
  const { vendorId, name = '' } = useLocalSearchParams<{ vendorId: string; name: string }>();
  const { primary } = usePrimarySociety();
  const items = useQuery({ queryKey: ['items'], queryFn: () => itemsList(), staleTime: 3_600_000 });
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
        <EmptyState illustration="list" title={en.eng.sentTitle} body={en.eng.sentBody(first)} actionLabel={en.common.done} onAction={() => router.back()} testID="request-sent" />
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
  const ready = !!(itemId || (freeText && freeText.trim().length >= 2));
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
              await createRequest({ vendor_id: vendorId, society_id: primary!.id, item_id: itemId, free_text: itemId ? null : freeText, qty: qty === 'custom' ? customQty : qty, note });
              track('request_created');
              qc.invalidateQueries({ queryKey: ['eng', 'my-requests'] });
              setState('sent');
            } catch (e) {
              if (e instanceof AppErrorException && e.appError.code === 'request_limit') return setState('limit');
              setError(e instanceof AppErrorException ? e.message : en.errors.unknown);
              setState('form');
            }
          }}
        />
      }
    >
      <Text variant="h2">{en.eng.requestFrom(name)}</Text>
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
