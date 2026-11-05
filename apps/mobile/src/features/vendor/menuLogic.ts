import { LIMITS, type PriceUnit } from '@sabzi/shared';

export type DraftItem = { itemId: string; name: string; selected: boolean; price: number | null; unit: PriceUnit; wasPrice: number | null; soldOut?: boolean };
export type Draft = Record<string, DraftItem>;

export type UsualItem = { id: string; name: string; defaultUnit: PriceUnit };
export type MenuLine = { itemId: string; price: number; unit: PriceUnit; soldOut?: boolean };

/** V-05: usual items as tiles; today's published menu (if any) pre-selects; yesterday gives "was" prices. */
export function buildDraft(usual: UsualItem[], today: MenuLine[] | null, yesterday: MenuLine[] | null): Draft {
  const t = new Map((today ?? []).map((m) => [m.itemId, m]));
  const y = new Map((yesterday ?? []).map((m) => [m.itemId, m]));
  const draft: Draft = {};
  for (const u of usual) {
    const cur = t.get(u.id);
    const prev = y.get(u.id);
    draft[u.id] = {
      itemId: u.id,
      name: u.name,
      selected: !!cur,
      price: cur?.price ?? null,
      unit: cur?.unit ?? prev?.unit ?? u.defaultUnit,
      wasPrice: prev?.price ?? null,
      soldOut: cur?.soldOut,
    };
  }
  return draft;
}

/** "Same as yesterday": select yesterday's items with yesterday's prices and units. */
export function copyYesterday(draft: Draft, yesterday: MenuLine[]): { draft: Draft; copied: number } {
  const next: Draft = { ...draft };
  let copied = 0;
  for (const y of yesterday) {
    const d = next[y.itemId];
    if (!d) continue;
    next[y.itemId] = { ...d, selected: true, price: y.price, unit: y.unit };
    copied++;
  }
  return { draft: next, copied };
}

export function toggleItem(draft: Draft, id: string): Draft {
  const d = draft[id];
  if (!d) return draft;
  return { ...draft, [id]: { ...d, selected: !d.selected } };
}

export function setPrice(draft: Draft, id: string, price: number, unit: PriceUnit): Draft {
  const d = draft[id];
  if (!d) return draft;
  return { ...draft, [id]: { ...d, selected: true, price, unit } };
}

const validPrice = (p: number | null): p is number => p != null && p >= LIMITS.priceMin && p <= LIMITS.priceMax;

/** Selected items without a valid price block publishing (red outline + hint). */
export function missingPrices(draft: Draft): DraftItem[] {
  return Object.values(draft).filter((d) => d.selected && !validPrice(d.price));
}

export function selectedItems(draft: Draft): DraftItem[] {
  return Object.values(draft).filter((d) => d.selected);
}

export function canPublish(draft: Draft): boolean {
  return selectedItems(draft).length > 0 && missingPrices(draft).length === 0;
}

export function toPublishItems(draft: Draft): { item_id: string; price: number; unit: PriceUnit }[] {
  return selectedItems(draft).map((d) => ({ item_id: d.itemId, price: d.price as number, unit: d.unit }));
}
