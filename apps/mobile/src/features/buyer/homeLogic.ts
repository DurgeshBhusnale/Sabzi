import { istHour, LIMITS, parseClock, istMinutesOfDay, STATUS_ORDER } from '@sabzi/shared';
import type { HomeVendor, MenuItemJson } from './types';

export type HomeSections = {
  atGate: HomeVendor[];
  comingToday: HomeVendor[];
  left: HomeVendor[];
  notComing: HomeVendor[];
  deals: { vendor: HomeVendor; items: MenuItemJson[] }[];
  showDeals: boolean;
  nobodyAtGate: boolean;
  allLeft: boolean;
  empty: boolean;
  nextExpected: HomeVendor | null;
};

/** B-03: status first — at the gate, then coming today by time, evening deals after 5 PM, not coming collapsed. */
export function homeSections(vendors: HomeVendor[], now: Date = new Date()): HomeSections {
  const sorted = [...vendors].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.window_start.localeCompare(b.window_start));
  const atGate = sorted.filter((v) => v.status === 'at_gate' || v.status === 'leaving_soon');
  const comingToday = sorted.filter((v) => v.status === 'expected').sort((a, b) => a.window_start.localeCompare(b.window_start));
  const left = sorted.filter((v) => v.status === 'left');
  const notComing = sorted.filter((v) => v.status === 'not_coming');
  const showDeals = istHour(now) >= LIMITS.eveningDealsFromHourIst;
  const deals = vendors
    .map((v) => ({ vendor: v, items: (v.menu?.items ?? []).filter((i) => i.deal_price != null && !i.sold_out) }))
    .filter((d) => d.items.length > 0);
  const nowMin = istMinutesOfDay(now);
  const nextExpected = comingToday.find((v) => parseClock(v.window_end) >= nowMin) ?? comingToday[0] ?? null;
  return {
    atGate,
    comingToday,
    left,
    notComing,
    deals,
    showDeals: showDeals && deals.length > 0,
    nobodyAtGate: vendors.length > 0 && atGate.length === 0 && comingToday.length > 0,
    allLeft: vendors.length > 0 && atGate.length === 0 && comingToday.length === 0 && left.length > 0,
    empty: vendors.length === 0,
    nextExpected,
  };
}

/** Top 3 available items for the hero card (sold out last). */
export function topItems(items: MenuItemJson[] | undefined, n = 3): MenuItemJson[] {
  return [...(items ?? [])].sort((a, b) => Number(a.sold_out) - Number(b.sold_out)).slice(0, n);
}

/** Menu state for B-05. */
export function menuState(items: MenuItemJson[] | undefined | null): 'not_posted' | 'all_sold_out' | 'ok' {
  if (!items || items.length === 0) return 'not_posted';
  if (items.every((i) => i.sold_out)) return 'all_sold_out';
  return 'ok';
}

export function needsSearch(items: MenuItemJson[] | undefined): boolean {
  return (items?.length ?? 0) > LIMITS.menuSearchThreshold;
}
