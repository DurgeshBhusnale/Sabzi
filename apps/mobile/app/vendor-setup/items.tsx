import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Button, EmptyState, ItemTile, Screen, SkeletonBlock, Text, TextInput, TopAppBar } from '../../src/ui';
import { useAllItems, useInvalidateVendor, useMyVendor, useUsualItems, vendorKeys } from '../../src/features/vendor/hooks';
import { addCustomItem, setUsualItems } from '../../src/features/vendor/api';
import { en } from '../../src/i18n/en';

/** V-02: 3-column picture grid with search; custom item when nothing matches. */
export default function UsualItems() {
  const usual = useUsualItems();
  if (usual.isLoading) return <Screen><SkeletonBlock kind="list" count={4} /></Screen>;
  return <ItemsPicker initial={(usual.data ?? []).map((u) => u.id)} />;
}

function ItemsPicker({ initial }: { initial: string[] }) {
  const t = useTheme();
  const items = useAllItems();
  const vendor = useMyVendor();
  const invalidate = useInvalidateVendor();
  const [selected, setSelected] = useState<string[]>(initial);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);


  const filtered = useMemo(() => (items.data ?? []).filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())), [items.data, q]);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const rows: (typeof filtered)[] = [];
  for (let i = 0; i < filtered.length; i += 3) rows.push(filtered.slice(i, i + 3));
  const firstTime = initial.length === 0 && vendor.data?.status !== 'verified';

  return (
    <Screen
      header={<TopAppBar title={en.vendor.itemsTitle} onBack={router.canGoBack() ? () => router.back() : undefined} />}
      footer={
        <View style={{ gap: t.spacing.xs }}>
          <Text variant="caption" align="center" color="textSecondary">{selected.length ? en.vendor.selectedCount(selected.length) : en.vendor.pickOne}</Text>
          <Button
            size="xl"
            label={en.common.continue}
            disabled={selected.length === 0}
            loading={busy}
            testID="items-continue"
            onPress={async () => {
              setBusy(true);
              try {
                await setUsualItems(selected);
                await invalidate(vendorKeys.usual);
                if (firstTime) router.replace('/vendor-setup/status');
                else router.back();
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      }
    >
      <Text color="textSecondary">{en.vendor.itemsBody}</Text>
      <TextInput kind="search" placeholder={en.vendor.searchItems} value={q} onChangeText={setQ} testID="item-search" />
      {q && filtered.length === 0 ? (
        <EmptyState
          illustration="crate"
          title={en.vendor.noMatch(q)}
          body={en.vendor.noMatchBody}
          actionLabel={en.vendor.addAsMine(q)}
          onAction={async () => {
            const it = await addCustomItem(q, 'kg');
            await invalidate(vendorKeys.items);
            setSelected((s) => [...s, it.id]);
            setQ('');
          }}
          secondaryLabel={en.vendor.clearSearch}
          onSecondary={() => setQ('')}
        />
      ) : (
        rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.spacing.xs }}>
            {row.map((it) => (
              <ItemTile key={it.id} name={it.name} state={selected.includes(it.id) ? 'selected' : 'unselected'} showSetPrice={false} onPress={() => toggle(it.id)} />
            ))}
            {Array.from({ length: 3 - row.length }).map((_, k) => (
              <View key={`f${k}`} style={{ flex: 1 }} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
