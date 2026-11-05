import { formatPriceCompact, isQuietHours } from './format.ts';
import type { PriceUnit } from './constants.ts';

/** Push copy from DESIGN_BRIEF §9.1. Shared by edge functions (Deno) and the app (in-app list). */
export type Message = { title: string; body: string };
export type MsgItem = { name: string; price: number; unit: PriceUnit; sold_out?: boolean; deal_price?: number | null };

export const firstName = (displayName: string) => displayName.trim().split(/\s+/)[0] ?? displayName;
/** "Green Park Residency" → "Green Park"; "Nandanvan Society" → "Nandanvan" */
export const shortSociety = (name: string) => name.replace(/\s+(Residency|Society|CHS|Co-op Housing Society)$/i, '').trim();
const plainItem = (name: string) => name.replace(/\s*\(.*\)\s*/, '').trim();
const lower = (s: string) => plainItem(s).toLowerCase();

export function arrivalMessage(vendor: string, gate: string, items: MsgItem[]): Message {
  const available = items.filter((i) => !i.sold_out);
  const top = available.slice(0, 3).map((i) => `${plainItem(i.name)} ${formatPriceCompact(i.price, i.unit)}`);
  const more = available.length - top.length;
  return {
    title: `${firstName(vendor)} is at ${gate} now`,
    body: top.length ? top.join(' · ') + (more > 0 ? ` + ${more} more` : '') : "Tap to see today's menu",
  };
}

export function leavingSoonMessage(vendor: string, gate: string, items: MsgItem[]): Message {
  const left = items.filter((i) => !i.sold_out).slice(0, 3).map((i) => lower(i.name));
  return {
    title: `${firstName(vendor)} leaves ${gate} in 10 min`,
    body: left.length ? `Still has ${left.join(', ')}` : 'Last chance to catch him today',
  };
}

export function dealMessage(vendor: string, items: MsgItem[]): Message {
  const deals = items.filter((i) => i.deal_price != null && !i.sold_out);
  const parts = deals.slice(0, 3).map((i, idx) =>
    idx === 0
      ? `${plainItem(i.name)} now ${formatPriceCompact(i.deal_price!, i.unit)} (was ₹${i.price})`
      : `${plainItem(i.name)} ${formatPriceCompact(i.deal_price!, i.unit)}`,
  );
  const more = deals.length - parts.length;
  return { title: `Evening deal from ${firstName(vendor)}`, body: parts.join(' · ') + (more > 0 ? ` + ${more} more` : '') };
}

export function notComingMessage(vendor: string, society: string): Message {
  return { title: `${firstName(vendor)} isn't coming to ${shortSociety(society)} today`, body: "We'll tell you when he's back" };
}

export function requestReplyMessage(vendor: string, item: string, qty: string | null, willBring: boolean): Message {
  return {
    title: willBring ? `${firstName(vendor)} will bring ${lower(item)} tomorrow` : `${firstName(vendor)} can't bring ${lower(item)} tomorrow`,
    body: qty ? `Your request for ${qty}` : 'Your request for tomorrow',
  };
}

export function vendorRequestsMessage(groups: { name: string; count: number }[]): Message {
  const total = groups.reduce((n, g) => n + g.count, 0);
  const sorted = [...groups].sort((a, b) => b.count - a.count);
  return {
    title: `${total} ${total === 1 ? 'request' : 'requests'} for tomorrow`,
    body: sorted.slice(0, 3).map((g) => `${plainItem(g.name)} ×${g.count}`).join(', ') + (sorted.length > 3 ? ` + ${sorted.length - 3} more` : ''),
  };
}

export function vendorRatingMessage(stars: number, society: string | null, text: string | null, tagLabels: string[]): Message {
  const quote = text?.trim() || tagLabels.join(', ');
  return {
    title: `New ${stars}★ rating${society ? ` from ${shortSociety(society)}` : ''}`,
    body: quote ? `"${quote.length > 80 ? `${quote.slice(0, 79)}…` : quote}"` : 'Tap to see it',
  };
}

export type NotifKind = 'arrival' | 'leaving_soon' | 'deal' | 'not_coming' | 'request_reply' | 'vendor_new_requests' | 'vendor_new_rating';

/** NOT-3: deals and request replies are not pushed between 21:00 and 06:00 IST; arrivals always are. */
export function pushAllowedNow(kind: NotifKind, now: Date = new Date()): boolean {
  if (kind === 'deal' || kind === 'request_reply' || kind === 'vendor_new_requests' || kind === 'vendor_new_rating') return !isQuietHours(now);
  return true;
}
