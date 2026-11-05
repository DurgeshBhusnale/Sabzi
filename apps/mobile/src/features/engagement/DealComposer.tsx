import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { dealMessage, formatIstTime, formatPrice, type PriceUnit } from '@sabzi/shared';
import { useTheme } from '../../theme/ThemeProvider';
import { Button, Card, EmptyState, ItemArt, PriceStepper, Text, isValidPrice } from '../../ui';
import { en } from '../../i18n/en';

export type DealLine = { itemId: string; name: string; price: number; unit: PriceUnit; soldOut: boolean };

export function pctOff(price: number, pct: number): number {
  return Math.max(1, Math.floor(price * (1 - pct / 100)));
}

/** V-11: pick unsold items, new price (stepper or −10% / −20%), preview, send to remaining followers. */
export function DealComposer({
  vendorName,
  lines,
  remainingFollowers,
  alreadySentAt,
  hasRemainingStops,
  onSend,
  onBack,
}: {
  vendorName: string;
  lines: DealLine[];
  remainingFollowers: number;
  alreadySentAt: string | null;
  hasRemainingStops: boolean;
  onSend: (items: { item_id: string; deal_price: number }[]) => Promise<void>;
  onBack: () => void;
}) {
  const t = useTheme();
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  if (alreadySentAt) return <EmptyState illustration="list" title={en.eng.dealUsed} body={en.eng.dealUsedBody(formatIstTime(alreadySentAt))} actionLabel={en.eng.backToToday} onAction={onBack} testID="deal-used" />;
  if (!hasRemainingStops) return <EmptyState illustration="tempo" title={en.eng.dealNoStops} body={en.eng.dealNoStopsBody} actionLabel={en.eng.backToToday} onAction={onBack} testID="deal-no-stops" />;
  const unsold = lines.filter((l) => !l.soldOut);
  if (unsold.length === 0) return <EmptyState illustration="crate" title={en.eng.noMenu} actionLabel={en.eng.backToToday} onAction={onBack} />;

  const chosen = unsold.filter((l) => picked[l.itemId] != null);
  const valid = chosen.length > 0 && chosen.every((l) => isValidPrice(picked[l.itemId]!) && picked[l.itemId]! < l.price);
  const preview = dealMessage(vendorName, chosen.map((l) => ({ name: l.name, price: l.price, unit: l.unit, deal_price: picked[l.itemId]! })));

  return (
    <View style={{ gap: t.spacing.md }} testID="deal-composer">
      <Text color="textSecondary">{en.eng.dealPick}</Text>
      {unsold.map((l) => {
        const on = picked[l.itemId] != null;
        return (
          <Card key={l.itemId} style={{ gap: t.spacing.sm, borderColor: on ? t.colors.primary : t.colors.border, borderWidth: on ? 2 : 1 }}>
            <Pressable
              testID={`deal-item-${l.name}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => {
                const next = { ...picked };
                if (on) delete next[l.itemId];
                else next[l.itemId] = pctOff(l.price, 20);
                setPicked(next);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.layout.minTouch }}
            >
              <ItemArt name={l.name} size={40} />
              <Text weight="600" style={{ flex: 1 }}>{l.name}</Text>
              <Text color="textSecondary" strike={on}>{formatPrice(l.price, l.unit)}</Text>
            </Pressable>
            {on ? (
              <>
                <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
                  {[10, 20].map((p) => (
                    <View key={p} style={{ flex: 1 }}>
                      <Button label={en.eng.pct(p)} variant="secondary" onPress={() => setPicked({ ...picked, [l.itemId]: pctOff(l.price, p) })} testID={`pct-${p}-${l.name}`} />
                    </View>
                  ))}
                </View>
                <PriceStepper price={picked[l.itemId]!} unit={l.unit} wasPrice={l.price} onChange={(p) => setPicked({ ...picked, [l.itemId]: p })} />
              </>
            ) : null}
          </Card>
        );
      })}
      {chosen.length ? (
        <Card tint="muted" style={{ gap: t.spacing.xxs }} testID="deal-preview">
          <Text variant="caption" color="textSecondary">{en.eng.dealPreview}</Text>
          <Text weight="700">{preview.title}</Text>
          <Text variant="bodySmall">{preview.body}</Text>
        </Card>
      ) : null}
      <Button
        size="xl"
        label={chosen.length ? en.eng.dealSend(remainingFollowers) : en.eng.dealPickItems}
        disabled={!valid}
        loading={busy}
        testID="send-deal"
        onPress={async () => {
          setBusy(true);
          try {
            await onSend(chosen.map((l) => ({ item_id: l.itemId, deal_price: picked[l.itemId]! })));
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
