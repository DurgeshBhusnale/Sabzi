import { istHour, LIMITS, parseClock, istMinutesOfDay, STATUS_ORDER } from '@sabzi/shared';
import type { HomeVendor, MenuItemJson } from './types';

export type HomeSections = {
  atGate: HomeVendor[];
  comingToday: HomeVendor[];
  /** Vendors whose stop runs tomorrow (owner review 2026-11-21), minus those still due today. */
  comingTomorrow: HomeVendor[];
  left: HomeVendor[];
  notComing: HomeVendor[];
  deals: { vendor: HomeVendor; items: MenuItemJson[] }[];
  showDeals: boolean;
  nobodyAtGate: boolean;
  allLeft: boolean;
  empty: boolean;
  nextExpected: HomeVendor | null;
  /** True when the next expected visit is tomorrow's (nothing left to come today). */
  nextIsTomorrow: boolean;
};

/** B-03: status first — at the gate, then coming today by time, evening deals after 5 PM, not coming collapsed. */
export function homeSections(vendors: HomeVendor[], now: Date = new Date(), tomorrow: HomeVendor[] = []): HomeSections {
  const nowMin = istMinutesOfDay(now);
  // A vendor who never arrived and whose window ended over an hour ago is not "coming today" any more.
  const missed = (v: HomeVendor) => v.status === 'expected' && parseClock(v.window_end) + LIMITS.expectedGraceMin < nowMin;
  const sorted = [...vendors].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.window_start.localeCompare(b.window_start));
  const atGate = sorted.filter((v) => v.status === 'at_gate' || v.status === 'leaving_soon');
  const comingToday = sorted.filter((v) => v.status === 'expected' && !missed(v)).sort((a, b) => a.window_start.localeCompare(b.window_start));
  const left = sorted.filter((v) => v.status === 'left');
  const dueToday = new Set([...atGate, ...comingToday].map((v) => v.vendor_id));
  const comingTomorrow = [...tomorrow].filter((v) => !dueToday.has(v.vendor_id)).sort((a, b) => a.window_start.localeCompare(b.window_start));
  const tomorrowIds = new Set(comingTomorrow.map((v) => v.vendor_id));
  // Missed vendors who come tomorrow are shown there; the rest read as not coming today.
  const notComing = sorted.filter((v) => v.status === 'not_coming' || (missed(v) && !tomorrowIds.has(v.vendor_id)));
  const showDeals = istHour(now) >= LIMITS.eveningDealsFromHourIst;
  const deals = vendors
    .map((v) => ({ vendor: v, items: (v.menu?.items ?? []).filter((i) => i.deal_price != null && !i.sold_out) }))
    .filter((d) => d.items.length > 0);
  const nextToday = comingToday.find((v) => parseClock(v.window_end) >= nowMin) ?? comingToday[0] ?? null;
  const nextExpected = nextToday ?? comingTomorrow[0] ?? null;
  return {
    atGate,
    comingToday,
    comingTomorrow,
    left,
    notComing,
    deals,
    showDeals: showDeals && deals.length > 0,
    nobodyAtGate: atGate.length === 0 && (comingToday.length > 0 || (comingTomorrow.length > 0 && left.length === 0)),
    allLeft: vendors.length > 0 && atGate.length === 0 && comingToday.length === 0 && left.length > 0,
    empty: vendors.length === 0 && comingTomorrow.length === 0,
    nextExpected,
    nextIsTomorrow: !nextToday && !!nextExpected,
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
