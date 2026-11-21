import { addDays, formatIstTime, formatTimeWindow, istHour, toIstDate } from './format.ts';
import type { PriceUnit } from './constants.ts';

/**
 * Stored request status (request flow v2, DECISIONS 2026-11-21) plus the derived "expired":
 * open → will_bring (vendor accepted + price) → accepted (buyer confirmed) | declined (buyer: not now);
 * open → cant_bring (vendor denied); accepted → vendor_cancelled (vendor denied later); cancelled by the buyer.
 * open / will_bring rows whose visit has started read as expired.
 */
export type RequestStatus = 'open' | 'will_bring' | 'cant_bring' | 'accepted' | 'declined' | 'vendor_cancelled' | 'cancelled' | 'expired';

/** VEN-10: group requests by item and sum quantities. */
export type RequestLite = {
  id: string;
  item_id: string | null;
  item_name: string | null;
  free_text: string | null;
  qty: string | null;
  note: string | null;
  buyer_first_name: string;
  society_name: string;
  status: RequestStatus;
  default_unit?: PriceUnit | null;
  quoted_price?: number | null;
  quoted_unit?: PriceUnit | null;
  last_price?: number | null;
  last_unit?: PriceUnit | null;
};

export type RequestGroup = {
  key: string;
  name: string;
  count: number;
  totalLabel: string | null;
  societies: string[];
  notes: { buyer: string; society: string; qty: string | null; note: string }[];
  status: 'open' | 'will_bring' | 'cant_bring' | 'mixed';
  /** What the vendor has decided for this item: still to answer, accepted (with a price) or denied. */
  decision: 'pending' | 'accepted' | 'denied';
  counts: { waiting: number; quoted: number; confirmed: number; declined: number; denied: number; expired: number };
  /** Price the vendor last quoted, else the last menu price — pre-fills the price box. */
  price: number | null;
  unit: PriceUnit;
  /** Buyers who confirmed (vendor "Confirmed list" tab) */
  confirmed: { buyer: string; society: string; qty: string | null; note: string | null }[];
  confirmedTotal: string | null;
};

type Parsed = { kind: 'g' | 'piece' | 'bunch'; amount: number } | null;

/** "500 g", "1 kg", "1.5kg", "2 pieces", "3 bunch" → normalised amount. Unknown text → null. */
export function parseQty(q: string | null | undefined): Parsed {
  if (!q) return null;
  const m = q.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|grams?|pc|pcs|piece|pieces|bunch|bunches)$/);
  if (!m) return null;
  const n = Number(m[1]);
  const u = m[2]!;
  if (u.startsWith('kg')) return { kind: 'g', amount: n * 1000 };
  if (u.startsWith('g')) return { kind: 'g', amount: n };
  if (u.startsWith('bunch')) return { kind: 'bunch', amount: n };
  return { kind: 'piece', amount: n };
}

function fmtGrams(g: number): string {
  if (g >= 1000) {
    const kg = g / 1000;
    return `${Number.isInteger(kg) ? kg : kg.toFixed(2).replace(/\.?0+$/, '')} kg`;
  }
  return `${g} g`;
}

/**
 * Totals per unit kind: "1.5 kg", "3 pieces", "1.5 kg + 2 pieces". Requests without a quantity count
 * as one buyer each and are not added to the total; if none have a quantity the total is null.
 */
export function sumQuantities(qtys: (string | null)[]): string | null {
  let g = 0;
  let pc = 0;
  let bunch = 0;
  const unknown: string[] = [];
  for (const q of qtys) {
    const p = parseQty(q);
    if (!p) {
      if (q && q.trim()) unknown.push(q.trim());
      continue;
    }
    if (p.kind === 'g') g += p.amount;
    else if (p.kind === 'piece') pc += p.amount;
    else bunch += p.amount;
  }
  const parts: string[] = [];
  if (g) parts.push(fmtGrams(g));
  if (pc) parts.push(`${pc} ${pc === 1 ? 'piece' : 'pieces'}`);
  if (bunch) parts.push(`${bunch} ${bunch === 1 ? 'bunch' : 'bunches'}`);
  parts.push(...unknown);
  return parts.length ? parts.join(' + ') : null;
}

export function requestKey(r: Pick<RequestLite, 'item_id' | 'free_text'>): string {
  return r.item_id ?? `free:${(r.free_text ?? '').trim().toLowerCase()}`;
}

export function groupRequests(rows: RequestLite[]): RequestGroup[] {
  const map = new Map<string, RequestLite[]>();
  for (const r of rows) {
    if (r.status === 'cancelled') continue;
    const k = requestKey(r);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  const groups: RequestGroup[] = [];
  for (const [key, rs] of map) {
    const statuses = new Set(rs.map((r) => r.status));
    const name = rs[0]!.item_name ?? (rs[0]!.free_text ?? '').trim().replace(/^./, (c) => c.toUpperCase());
    groups.push({
      key,
      name,
      count: rs.length,
      totalLabel: sumQuantities(rs.map((r) => r.qty)),
      societies: [...new Set(rs.map((r) => r.society_name))],
      notes: rs.filter((r) => r.note).map((r) => ({ buyer: r.buyer_first_name, society: r.society_name, qty: r.qty, note: r.note! })),
      status: statuses.size === 1 ? (rs[0]!.status as RequestGroup['status']) : 'mixed',
      ...decide(rs),
    });
  }
  return groups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function decide(rs: RequestLite[]): Pick<RequestGroup, 'decision' | 'counts' | 'price' | 'unit' | 'confirmed' | 'confirmedTotal'> {
  const n = (f: (r: RequestLite) => boolean) => rs.filter(f).length;
  const counts = {
    waiting: n((r) => r.status === 'open'),
    quoted: n((r) => r.status === 'will_bring'),
    confirmed: n((r) => r.status === 'accepted'),
    declined: n((r) => r.status === 'declined'),
    denied: n((r) => r.status === 'cant_bring' || r.status === 'vendor_cancelled'),
    expired: n((r) => r.status === 'expired'),
  };
  const yes = counts.quoted + counts.confirmed + counts.declined;
  const decision: RequestGroup['decision'] = counts.waiting > 0 ? 'pending' : yes > 0 ? 'accepted' : counts.denied > 0 ? 'denied' : 'pending';
  const quoted = rs.find((r) => r.status === 'will_bring' && r.quoted_price != null) ?? rs.find((r) => r.quoted_price != null);
  const first = rs[0]!;
  const price = quoted?.quoted_price ?? first.last_price ?? null;
  const unit: PriceUnit = quoted?.quoted_unit ?? first.last_unit ?? first.default_unit ?? 'kg';
  const conf = rs.filter((r) => r.status === 'accepted');
  return {
    decision,
    counts,
    price: price == null ? null : Number(price),
    unit,
    confirmed: conf.map((r) => ({ buyer: r.buyer_first_name, society: r.society_name, qty: r.qty, note: r.note })),
    confirmedTotal: sumQuantities(conf.map((r) => r.qty)),
  };
}

// ---------------------------------------------------------------- slots (request flow v2)

/** Morning before 12:00 IST, afternoon before 16:00, evening after. */
export function dayPart(slotStart: string | Date): 'morning' | 'afternoon' | 'evening' {
  const h = istHour(typeof slotStart === 'string' ? new Date(slotStart) : slotStart);
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  return 'evening';
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayWord(isoDate: string, now: Date): string {
  const today = toIstDate(now);
  if (isoDate === today) return 'Today';
  if (isoDate === addDays(today, 1)) return 'Tomorrow';
  return WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]!;
}

const asDate = (d: string | Date) => (typeof d === 'string' ? new Date(d) : d);

/** "Today evening", "Tomorrow morning", "Sunday morning" */
export function slotDayLabel(slotStart: string | Date, now: Date = new Date()): string {
  const d = asDate(slotStart);
  return `${dayWord(toIstDate(d), now)} ${dayPart(d)}`;
}

/** For sentences: "tomorrow morning", "this evening", "Sunday morning" */
export function slotPhrase(slotStart: string | Date, now: Date = new Date()): string {
  const d = asDate(slotStart);
  const word = dayWord(toIstDate(d), now);
  if (word === 'Today') return `this ${dayPart(d)}`;
  if (word === 'Tomorrow') return `tomorrow ${dayPart(d)}`;
  return `${word} ${dayPart(d)}`;
}

function istClock(d: Date): string {
  const ist = new Date(d.getTime() + 330 * 60_000);
  return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
}

/** "8:00–8:45 AM" from the slot's UTC timestamps */
export function slotWindowLabel(slotStart: string | Date, slotEnd: string | Date): string {
  return formatTimeWindow(istClock(asDate(slotStart)), istClock(asDate(slotEnd)));
}

/** "1:00 PM today", "10:30 PM tonight", "10:30 PM tomorrow", "10:30 PM Saturday" */
export function cutoffPhrase(cutoff: string | Date, now: Date = new Date()): string {
  const c = asDate(cutoff);
  const time = formatIstTime(c);
  const word = dayWord(toIstDate(c), now);
  if (word === 'Today') return `${time} ${istHour(c) >= 18 ? 'tonight' : 'today'}`;
  return `${time} ${word === 'Tomorrow' ? 'tomorrow' : word}`;
}

export type RequestSlot = {
  stop_id: string;
  date: string;
  window_start: string;
  window_end: string;
  gate_name: string;
  slot_start: string;
  cutoff_at: string;
};

export type VendorRequestRow = RequestLite & {
  for_date: string;
  stop_id: string | null;
  slot_start: string;
  slot_end: string;
  gate_name: string | null;
};

export type SlotGroup = {
  key: string;
  stop_id: string | null;
  for_date: string;
  slot_start: string;
  slot_end: string;
  gate_name: string | null;
  societies: string[];
  items: RequestGroup[];
};

/** Read-side "expired": unanswered or unconfirmed when the visit starts. */
export function effectiveStatus(r: { status: RequestStatus; slot_start: string }, now: Date = new Date()): RequestStatus {
  if ((r.status === 'open' || r.status === 'will_bring') && Date.parse(r.slot_start) <= now.getTime()) return 'expired';
  return r.status;
}

/** Vendor screen: visits not yet over, soonest first, each with its requests grouped by item. */
export function groupBySlot(rows: VendorRequestRow[], now: Date = new Date()): SlotGroup[] {
  const map = new Map<string, VendorRequestRow[]>();
  for (const r of rows) {
    if (r.status === 'cancelled' || Date.parse(r.slot_end) <= now.getTime()) continue;
    const k = `${r.stop_id ?? 'none'}|${r.for_date}`;
    map.set(k, [...(map.get(k) ?? []), { ...r, status: effectiveStatus(r, now) }]);
  }
  return [...map.entries()]
    .map(([key, rs]) => ({
      key,
      stop_id: rs[0]!.stop_id,
      for_date: rs[0]!.for_date,
      slot_start: rs[0]!.slot_start,
      slot_end: rs[0]!.slot_end,
      gate_name: rs[0]!.gate_name,
      societies: [...new Set(rs.map((r) => r.society_name))],
      items: groupRequests(rs),
    }))
    .sort((a, b) => Date.parse(a.slot_start) - Date.parse(b.slot_start));
}
