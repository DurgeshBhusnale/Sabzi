import { LIMITS, nearestWithin, type LatLng } from '@sabzi/shared';

export type TodayStop = {
  stopId: string;
  gateId: string;
  gateName: string;
  societyName: string;
  lat: number;
  lng: number;
  windowStart: string;
  windowEnd: string;
  followers: number;
  skipped: boolean;
  arrivedAt: string | null;
  leftAt: string | null;
  leavingAt: string | null;
  /** Latest arrival at this gate (any day) for the 2-hour rule */
  lastArrivalAt: string | null;
  arrivalEventId: string | null;
};

/** VEN-6: arrival is locked for 2 hours after the last alert at the same gate. Returns the unlock time or null. */
export function cooldownUntil(stop: Pick<TodayStop, 'lastArrivalAt'>, now: Date = new Date()): Date | null {
  if (!stop.lastArrivalAt) return null;
  const until = new Date(Date.parse(stop.lastArrivalAt) + LIMITS.arrivalCooldownHours * 3_600_000);
  return until > now ? until : null;
}

export type ArrivalSuggestion =
  | { kind: 'suggested'; stop: TodayStop; distance: number }
  | { kind: 'none_nearby' }
  | { kind: 'gps_off' }
  | { kind: 'no_stops' };

/** V-08: nearest of today's stops within 300 m of the phone; otherwise the vendor picks manually. */
export function suggestStop(position: LatLng | null, stops: TodayStop[]): ArrivalSuggestion {
  const candidates = stops.filter((s) => !s.skipped);
  if (candidates.length === 0) return { kind: 'no_stops' };
  if (!position) return { kind: 'gps_off' };
  const found = nearestWithin(position, candidates, LIMITS.arrivalRadiusMeters);
  return found ? { kind: 'suggested', stop: found.item, distance: found.distance } : { kind: 'none_nearby' };
}

export type StopPhase = 'upcoming' | 'current' | 'done' | 'skipped';

/** State of a stop on the Today timeline (V-04) and Stops tab (V-12). */
export function stopPhase(s: TodayStop, now: Date = new Date()): StopPhase {
  if (s.skipped) return 'skipped';
  if (s.arrivedAt && !s.leftAt && now.getTime() - Date.parse(s.arrivedAt) < LIMITS.atGateHours * 3_600_000) return 'current';
  if (s.arrivedAt) return 'done';
  return 'upcoming';
}

export function currentStop(stops: TodayStop[], now: Date = new Date()): TodayStop | null {
  return stops.find((s) => stopPhase(s, now) === 'current') ?? null;
}

export function allStopsDone(stops: TodayStop[], now: Date = new Date()): boolean {
  return stops.length > 0 && stops.every((s) => ['done', 'skipped'].includes(stopPhase(s, now)));
}

/** Followers at stops still ahead today (V-11 "remaining stops"). */
export function remainingFollowers(stops: TodayStop[], now: Date = new Date()): number {
  return stops.filter((s) => ['upcoming', 'current'].includes(stopPhase(s, now))).reduce((n, s) => n + s.followers, 0);
}
