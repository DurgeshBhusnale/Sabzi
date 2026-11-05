import { LIMITS } from './constants.ts';
import { formatIstTime, formatTimeWindow } from './format.ts';

export type VendorLiveStatus = 'at_gate' | 'leaving_soon' | 'left' | 'not_coming' | 'expected';
export type StopEventType = 'arrived' | 'leaving_soon' | 'left' | 'not_going';

export type StopEventLite = { type: StopEventType; created_at: string };

/**
 * Same rules as SQL `v_vendor_today` (TECH_SPEC §4.3):
 * - not_coming: a `not_going` event (skip) for today
 * - left: a `left` event after the latest arrival, or arrival older than 3 h
 * - leaving_soon: latest arrival within 3 h followed by `leaving_soon`
 * - at_gate: arrival within the last 3 h with no `left` after it
 * - expected: otherwise
 */
export function computeLiveStatus(
  events: readonly StopEventLite[],
  opts: { skippedToday?: boolean; now?: Date } = {},
): { status: VendorLiveStatus; since: string | null } {
  const now = opts.now ?? new Date();
  if (opts.skippedToday || events.some((e) => e.type === 'not_going')) {
    return { status: 'not_coming', since: null };
  }
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const lastArrival = [...sorted].reverse().find((e) => e.type === 'arrived');
  if (!lastArrival) return { status: 'expected', since: null };
  const after = sorted.filter((e) => e.created_at > lastArrival.created_at);
  const left = after.find((e) => e.type === 'left');
  if (left) return { status: 'left', since: left.created_at };
  const ageMs = now.getTime() - new Date(lastArrival.created_at).getTime();
  if (ageMs > LIMITS.atGateHours * 3_600_000) return { status: 'left', since: null };
  if (after.some((e) => e.type === 'leaving_soon')) {
    return { status: 'leaving_soon', since: lastArrival.created_at };
  }
  return { status: 'at_gate', since: lastArrival.created_at };
}

/** Pill label, e.g. "At Gate 1 now", "Expected 8:00–8:45 AM" (design brief §2.3) */
export function statusLabel(
  status: VendorLiveStatus,
  ctx: { gateName?: string; windowStart?: string; windowEnd?: string; since?: string | null },
): string {
  switch (status) {
    case 'at_gate':
      return ctx.gateName ? `At ${ctx.gateName} now` : 'At the gate now';
    case 'leaving_soon':
      return 'Leaving in 10 min';
    case 'left':
      return ctx.since ? `Left at ${formatIstTime(ctx.since)}` : 'Left for today';
    case 'not_coming':
      return 'Not coming today';
    case 'expected':
      return ctx.windowStart && ctx.windowEnd
        ? `Expected ${formatTimeWindow(ctx.windowStart, ctx.windowEnd)}`
        : 'Expected today';
  }
}

/** Sort order for buyer home: at gate first, then leaving soon, expected by window, left, not coming */
export const STATUS_ORDER: Record<VendorLiveStatus, number> = {
  at_gate: 0,
  leaving_soon: 1,
  expected: 2,
  left: 3,
  not_coming: 4,
};
