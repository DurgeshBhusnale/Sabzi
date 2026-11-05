import { parseClock } from './format.ts';

export type StopLite = { id?: string | null; vendor_id: string; gate_id: string; days_of_week: number[]; window_start: string; window_end: string; active?: boolean };

export type StopConflict = { a: StopLite; b: StopLite; kind: 'vendor_double_booked' | 'gate_shared'; days: number[] };

const overlapMinutes = (a: StopLite, b: StopLite) => parseClock(a.window_start) < parseClock(b.window_end) && parseClock(b.window_start) < parseClock(a.window_end);
const sharedDays = (a: StopLite, b: StopLite) => a.days_of_week.filter((d) => b.days_of_week.includes(d)).sort();

/**
 * A-07 conflicts: the same vendor in two places at once (error), or two vendors at the same gate at the
 * same time (warning — allowed, but the team should know).
 */
export function findStopConflicts(candidate: StopLite, existing: StopLite[]): StopConflict[] {
  const out: StopConflict[] = [];
  for (const s of existing) {
    if (s.active === false || (candidate.id && s.id === candidate.id)) continue;
    const days = sharedDays(candidate, s);
    if (days.length === 0 || !overlapMinutes(candidate, s)) continue;
    if (s.vendor_id === candidate.vendor_id) out.push({ a: candidate, b: s, kind: 'vendor_double_booked', days });
    else if (s.gate_id === candidate.gate_id) out.push({ a: candidate, b: s, kind: 'gate_shared', days });
  }
  return out;
}

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
