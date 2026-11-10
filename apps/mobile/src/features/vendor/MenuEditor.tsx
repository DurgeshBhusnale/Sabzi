import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { formatPrice, UNIT_LABELS, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, BottomSheet, Button, Chip, ItemArt, ItemTile, PriceStepper, Snackbar, Text, TextInput, isValidPrice } from '../../ui';
import { canPublish, copyYesterday, missingPrices, selectedItems, setPrice, toggleItem, toPublishItems, type Draft, type MenuLine } from './menuLogic';
import { en } from '../../i18n/en';

/**
 * V-05 grid + V-06 price sheet. Tapping an unselected tile selects it and opens the price;
 * tapping a selected tile opens the price sheet where it can also be removed.
 */
export function MenuEditor({
  initial,
  yesterday,
  onPublish,
  publishing,
  offlineNote,
}: {
  initial: Draft;
  yesterday: MenuLine[] | null;
  onPublish: (items: ReturnType<typeof toPublishItems>) => void;
  publishing: boolean;
  offlineNote?: string | null;
}) {
  const t = useTheme();
  const [draft, setDraft] = useState<Draft>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [price, setPriceState] = useState(0);
  const [unit, setUnit] = useState<PriceUnit>('kg');
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const all = useMemo(() => Object.values(draft), [draft]);
  const selected = selectedItems(draft);
  const missing = missingPrices(draft);
  const rows: (typeof all)[] = [];
  for (let i = 0; i < all.length; i += 3) rows.push(all.slice(i, i + 3));

  const open = (id: string) => {
    const d = draft[id]!;
    if (!d.selected) setDraft(toggleItem(draft, id));
    setPriceState(d.price ?? d.wasPrice ?? 0);
    setUnit(d.unit);
    setTyping(false);
    setEditing(id);
  };
  const cur = editing ? draft[editing] : null;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.sm }}>
        <Text variant="bodySmall" color="textSecondary">{en.vendor.usualCount(selected.length, all.length)}</Text>
        {yesterday?.length ? (
          <Chip
            label={en.vendor.yesterday}
            testID="same-as-yesterday"
            onPress={() => {
              const r = copyYesterday(draft, yesterday);
              setDraft(r.draft);
              setToast(en.vendor.copied(r.copied));
            }}
          />
        ) : null}
      </View>
      {offlineNote ? <Banner kind="offline" message={offlineNote} /> : null}
      <View style={{ gap: t.spacing.xs }}>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.spacing.xs }}>
            {row.map((d) => (
              <ItemTile
                key={d.itemId}
                name={d.name}
                state={d.selected ? (d.price != null ? 'priced' : 'selected') : 'unselected'}
                price={d.price}
                unit={d.unit}
                wasPrice={d.wasPrice}
                missingPrice={d.selected && !isValidPrice(d.price ?? 0)}
                onPress={() => open(d.itemId)}
              />
            ))}
            {Array.from({ length: 3 - row.length }).map((_, k) => (
              <View key={`f${k}`} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>
      <View style={{ gap: t.spacing.xs, marginTop: t.spacing.md }}>
        {missing.length ? <Text color="error" align="center" testID="missing-hint">{en.vendor.setPriceFor(missing.map((m) => m.name).join(', '))}</Text> : null}
        {toast ? <Snackbar kind="info" message={toast} /> : null}
        <Button
          size="xl"
          label={selected.length ? (publishing ? en.vendor.publishing : en.vendor.publish(selected.length)) : en.vendor.pickToPublish}
          disabled={!canPublish(draft)}
          loading={publishing}
          testID="publish"
          onPress={() => onPublish(toPublishItems(draft))}
        />
      </View>

      <BottomSheet
        visible={!!cur}
        onClose={() => setEditing(null)}
        testID="price-sheet"
        footer={
          cur ? (
            <View style={{ gap: t.spacing.xs }}>
              <Button
                size="xl"
                label={en.vendor.savePrice(formatPrice(price, unit))}
                disabled={!isValidPrice(price)}
                testID="save-price"
                onPress={() => {
                  setDraft(setPrice(draft, cur.itemId, price, unit));
                  setEditing(null);
                }}
              />
              <Button
                label={en.common.cancel}
                variant="tertiary"
                onPress={() => {
                  if (cur.price == null) setDraft(toggleItem(draft, cur.itemId));
                  setEditing(null);
                }}
              />
            </View>
          ) : null
        }
      >
        {cur ? (
          <View style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <ItemArt name={cur.name} size={48} />
              <Text variant="h1" style={{ fontSize: 24, lineHeight: 28 }}>{cur.name}</Text>
            </View>
            {typing ? (
              <TextInput kind="price" label={en.vendor.perUnit(UNIT_LABELS[unit])} value={price ? String(price) : ''} onChangeText={(v) => setPriceState(Number(v.replace(/\D/g, '')) || 0)} autoFocus testID="price-typing" />
            ) : null}
            <PriceStepper price={price} unit={unit} wasPrice={cur.wasPrice} onChange={setPriceState} onUnitChange={setUnit} onEditNumber={() => setTyping(true)} />
            {cur.selected && cur.price != null ? (
              <Button
                label={en.vendor.removeFromToday(cur.name)}
                variant="tertiary"
                onPress={() => {
                  setDraft(toggleItem(draft, cur.itemId));
                  setEditing(null);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}
