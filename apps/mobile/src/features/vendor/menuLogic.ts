import { LIMITS, type PriceUnit } from '@sabzi/shared';

export type DraftItem = { itemId: string; name: string; selected: boolean; price: number | null; unit: PriceUnit; wasPrice: number | null; soldOut?: boolean };
export type Draft = Record<string, DraftItem>;

export type UsualItem = { id: string; name: string; defaultUnit: PriceUnit };
export type MenuLine = { itemId: string; price: number; unit: PriceUnit; soldOut?: boolean };

/**
 * V-05: usual items as tiles; today's published menu (if any) pre-selects; the last menu gives "was" prices.
 * Items from the last menu that are no longer in the usual list still get a tile, so "Last menu" copies them all.
 */
export function buildDraft(usual: UsualItem[], today: MenuLine[] | null, last: (MenuLine & { name?: string })[] | null): Draft {
  const t = new Map((today ?? []).map((m) => [m.itemId, m]));
  const y = new Map((last ?? []).map((m) => [m.itemId, m]));
  const known = new Set(usual.map((u) => u.id));
  const extra: UsualItem[] = (last ?? []).filter((m) => !known.has(m.itemId) && m.name).map((m) => ({ id: m.itemId, name: m.name!, defaultUnit: m.unit }));
  const draft: Draft = {};
  for (const u of [...usual, ...extra]) {
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

/** "Last menu": select the last menu's items with its prices and units. Nothing is published. */
export function copyLastMenu(draft: Draft, last: MenuLine[]): { draft: Draft; copied: number } {
  const next: Draft = { ...draft };
  let copied = 0;
  for (const y of last) {
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

/** True when every item of the last menu is already selected at its price and unit (the button has nothing to do). */
export function matchesLastMenu(draft: Draft, last: MenuLine[]): boolean {
  return last.every((y) => {
    const d = draft[y.itemId];
    return !d || (d.selected && d.price === y.price && d.unit === y.unit);
  });
}
