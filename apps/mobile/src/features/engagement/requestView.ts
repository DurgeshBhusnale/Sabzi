import { cutoffPhrase, formatIstTime, formatPrice, slotDayLabel, slotPhrase, slotWindowLabel, firstName } from '@sabzi/shared';
import type { PillStatus, RequestTone } from '../../ui';
import { en } from '../../i18n/en';
import type { MyRequest } from './api';

export type BuyerRequestView = {
  pill: { status: PillStatus; label: string };
  tone: RequestTone;
  headline: string;
  detail: string;
  /** "Tomorrow morning · 8:00–8:45 AM" */
  when: string;
  /** "₹40 / kg" while the buyer still has to confirm, or after confirming */
  price: string | null;
  /** The buyer must answer the vendor's price */
  needsReply: boolean;
  /** Upcoming (not finished, not closed) */
  active: boolean;
  canCancel: boolean;
  /** Delivered within the last 24 h and not reported yet: show "I didn't get it" */
  canReportNotReceived: boolean;
};

/** One place that decides how a buyer's request reads, so the card and the detail screen always agree. */
export function buyerRequestView(r: MyRequest, now: Date = new Date()): BuyerRequestView {
  const n = firstName(r.vendor_name);
  const when = `${slotDayLabel(r.slot_start, now)} · ${slotWindowLabel(r.slot_start, r.slot_end)}`;
  const phrase = slotPhrase(r.slot_start, now);
  const price = r.quoted_price != null ? formatPrice(Number(r.quoted_price), r.quoted_unit ?? 'kg') : null;
  const upcoming = Date.parse(r.slot_start) > now.getTime();
  const base = { when, needsReply: false, active: false, canCancel: false, canReportNotReceived: false, price: null as string | null };
  switch (r.status) {
    case 'open':
      return { ...base, pill: { status: 'waiting', label: en.req.pill.open! }, tone: 'waiting', headline: en.req.headline.open(n), detail: en.req.detail.open(n, cutoffPhrase(r.slot_start, now)), active: upcoming, canCancel: upcoming };
    case 'will_bring':
      return { ...base, pill: { status: 'deal', label: en.req.pill.will_bring! }, tone: 'action', headline: en.req.headline.will_bring(n), detail: en.req.detail.will_bring(n, phrase), price, needsReply: upcoming, active: upcoming, canCancel: upcoming };
    case 'accepted':
      return { ...base, pill: { status: 'will_bring', label: en.req.pill.accepted! }, tone: 'success', headline: en.req.headline.accepted(), detail: en.req.detail.accepted(n, phrase), price, active: upcoming, canCancel: upcoming };
    case 'cant_bring':
      return { ...base, pill: { status: 'cant_bring', label: en.req.pill.cant_bring! }, tone: 'error', headline: en.req.headline.cant_bring(), detail: en.req.detail.cant_bring(n) };
    case 'vendor_cancelled':
      return { ...base, pill: { status: 'cant_bring', label: en.req.pill.vendor_cancelled! }, tone: 'error', headline: en.req.headline.vendor_cancelled(n), detail: en.req.detail.vendor_cancelled(n) };
    case 'delivered': {
      const recent = !!r.delivered_at && now.getTime() - Date.parse(r.delivered_at) < 24 * 3_600_000;
      return { ...base, pill: { status: 'will_bring', label: en.req.pillDelivered }, tone: 'success', headline: en.req.hDelivered(), detail: en.req.dDelivered(n, r.delivered_at ? formatIstTime(r.delivered_at) : ''), price, canReportNotReceived: recent && !r.buyer_disputed_at };
    }
    case 'not_delivered':
      return { ...base, pill: { status: 'cant_bring', label: en.req.pillNotDelivered }, tone: 'error', headline: en.req.hNotDelivered(n), detail: en.req.buyerWhy[r.missed_reason ?? 'other']!(n) };
    case 'not_recorded':
      return { ...base, pill: { status: 'left', label: en.req.pillNotRecorded }, tone: 'muted', headline: en.req.hNotRecorded(), detail: en.req.dNotRecorded(n) };
    case 'declined':
      return { ...base, pill: { status: 'left', label: en.req.pill.declined! }, tone: 'muted', headline: en.req.headline.declined(), detail: en.req.detail.declined() };
    case 'expired':
    default: {
      const buyerLate = r.quoted_price != null;
      return {
        ...base,
        pill: { status: 'left', label: en.req.pill.expired! },
        tone: 'muted',
        headline: buyerLate ? en.req.headline.expiredBuyer() : en.req.headline.expiredVendor(n),
        detail: buyerLate ? en.req.detail.expiredBuyer() : en.req.detail.expiredVendor(),
      };
    }
  }
}

/** B-12 sections: what needs the buyer first, then what's coming, then history. */
export function sectionRequests(rows: MyRequest[], now: Date = new Date()) {
  const action: MyRequest[] = [];
  const upcoming: MyRequest[] = [];
  const past: MyRequest[] = [];
  for (const r of rows) {
    const v = buyerRequestView(r, now);
    if (v.needsReply) action.push(r);
    else if (v.active) upcoming.push(r);
    else past.push(r);
  }
  const bySlot = (a: MyRequest, b: MyRequest) => Date.parse(a.slot_start) - Date.parse(b.slot_start);
  return { action: action.sort(bySlot), upcoming: upcoming.sort(bySlot), past };
}

export type Step = { label: string; at?: string | null; state: 'done' | 'current' | 'todo' | 'failed' };

/** Timeline: request sent → vendor's answer → buyer's answer → the visit. */
export function requestSteps(r: MyRequest): Step[] {
  const n = firstName(r.vendor_name);
  const price = r.quoted_price != null ? formatPrice(Number(r.quoted_price), r.quoted_unit ?? 'kg') : '';
  const steps: Step[] = [{ label: en.req.step.sent, at: r.created_at, state: 'done' }];
  const s = r.status;
  const vendorSaidYes = r.quoted_price != null && s !== 'cant_bring';
  if (s === 'cant_bring') steps.push({ label: en.req.step.vendorDenied(n), at: r.answered_at, state: 'failed' });
  else if (vendorSaidYes) steps.push({ label: en.req.step.vendorAccepted(n, price), at: r.answered_at, state: 'done' });
  else steps.push({ label: en.req.step.vendorPending(n), state: s === 'open' ? 'current' : 'failed' });
  if (s === 'cant_bring') return steps;
  const confirmed = s === 'accepted' || s === 'vendor_cancelled' || s === 'delivered' || s === 'not_delivered' || s === 'not_recorded';
  if (confirmed) steps.push({ label: en.req.step.youConfirmed, at: r.responded_at, state: 'done' });
  else if (s === 'declined') return [...steps, { label: en.req.step.youDeclined, at: r.responded_at, state: 'failed' }];
  else steps.push({ label: en.req.step.youPending, state: s === 'will_bring' ? 'current' : s === 'expired' && vendorSaidYes ? 'failed' : 'todo' });
  if (s === 'vendor_cancelled') return [...steps, { label: en.req.step.vendorCancelled(n), at: r.answered_at, state: 'failed' }];
  if (s === 'delivered') return [...steps, { label: en.req.stepDelivered(n), at: r.delivered_at, state: 'done' }];
  if (s === 'not_delivered') return [...steps, { label: en.req.stepNotDelivered(n), at: r.delivered_at, state: 'failed' }];
  if (s === 'not_recorded') return [...steps, { label: en.req.stepNotRecorded, state: 'failed' }];
  steps.push({ label: en.req.step.visit(n), state: s === 'accepted' ? 'current' : s === 'expired' ? 'failed' : 'todo' });
  return steps;
}
