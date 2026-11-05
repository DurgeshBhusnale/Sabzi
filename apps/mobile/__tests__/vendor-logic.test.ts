import { allStopsDone, cooldownUntil, currentStop, remainingFollowers, stopPhase, suggestStop, type TodayStop } from '../src/features/vendor/arrival';
import { buildDraft, canPublish, copyYesterday, missingPrices, setPrice, toggleItem, toPublishItems, type UsualItem } from '../src/features/vendor/menuLogic';

const stop = (o: Partial<TodayStop>): TodayStop => ({
  stopId: 's',
  gateId: 'g',
  gateName: 'Gate 1',
  societyName: 'Green Park',
  lat: 18.4895,
  lng: 73.8215,
  windowStart: '08:00',
  windowEnd: '08:45',
  followers: 42,
  skipped: false,
  arrivedAt: null,
  leftAt: null,
  leavingAt: null,
  lastArrivalAt: null,
  arrivalEventId: null,
  ...o,
});

const greenPark = stop({ stopId: 'gp', gateId: 'gp1', lat: 18.4895, lng: 73.8215 });
const sahyadri = stop({ stopId: 'sh', gateId: 'shm', gateName: 'Main Gate', societyName: 'Sahyadri Heights', lat: 18.4935, lng: 73.8186, followers: 54 });

describe('arrival suggestion (VEN-6)', () => {
  it('picks the nearest gate within 300 m', () => {
    const r = suggestStop({ lat: 18.4911, lng: 73.8215 }, [sahyadri, greenPark]); // ~180 m from Green Park
    expect(r.kind).toBe('suggested');
    if (r.kind === 'suggested') {
      expect(r.stop.stopId).toBe('gp');
      expect(Math.round(r.distance / 10) * 10).toBe(180);
    }
  });
  it('picks the closer of two gates that are both within range', () => {
    const a = stop({ stopId: 'a', lat: 18.5, lng: 73.8 });
    const b = stop({ stopId: 'b', lat: 18.5012, lng: 73.8 }); // ~133 m north of a
    const r = suggestStop({ lat: 18.5009, lng: 73.8 }, [a, b]); // ~33 m from b, ~100 m from a
    expect(r.kind === 'suggested' && r.stop.stopId).toBe('b');
  });
  it('asks to choose manually when no stop is within 300 m', () => {
    expect(suggestStop({ lat: 18.5, lng: 73.84 }, [greenPark, sahyadri]).kind).toBe('none_nearby');
  });
  it('treats 301 m as too far', () => {
    const r = suggestStop({ lat: 18.4895 + 301 / 111_195, lng: 73.8215 }, [greenPark]);
    expect(r.kind).toBe('none_nearby');
  });
  it('falls back to the list when GPS is off', () => {
    expect(suggestStop(null, [greenPark]).kind).toBe('gps_off');
  });
  it('ignores skipped stops and reports no stops', () => {
    expect(suggestStop({ lat: 18.4895, lng: 73.8215 }, [stop({ skipped: true })]).kind).toBe('no_stops');
  });
});

describe('2-hour lock', () => {
  const now = new Date('2026-11-05T03:00:00Z');
  it('locks for 2 hours after the last alert and gives the unlock time', () => {
    const until = cooldownUntil({ lastArrivalAt: '2026-11-05T02:35:00Z' }, now);
    expect(until?.toISOString()).toBe('2026-11-05T04:35:00.000Z');
  });
  it('is open after 2 hours', () => {
    expect(cooldownUntil({ lastArrivalAt: '2026-11-05T00:59:00Z' }, now)).toBeNull();
    expect(cooldownUntil({ lastArrivalAt: null }, now)).toBeNull();
  });
});

describe('stop phases', () => {
  const now = new Date('2026-11-05T03:00:00Z');
  it('upcoming, current, done and skipped', () => {
    expect(stopPhase(greenPark, now)).toBe('upcoming');
    expect(stopPhase(stop({ arrivedAt: '2026-11-05T02:35:00Z' }), now)).toBe('current');
    expect(stopPhase(stop({ arrivedAt: '2026-11-05T02:35:00Z', leftAt: '2026-11-05T02:55:00Z' }), now)).toBe('done');
    expect(stopPhase(stop({ skipped: true }), now)).toBe('skipped');
  });
  it('finds the current stop and knows when the day is done', () => {
    const cur = stop({ stopId: 'c', arrivedAt: '2026-11-05T02:35:00Z' });
    expect(currentStop([greenPark, cur], now)?.stopId).toBe('c');
    expect(allStopsDone([stop({ arrivedAt: '2026-11-05T01:00:00Z', leftAt: '2026-11-05T01:30:00Z' }), stop({ skipped: true })], now)).toBe(true);
    expect(allStopsDone([greenPark], now)).toBe(false);
    expect(remainingFollowers([greenPark, sahyadri, stop({ skipped: true, followers: 9 })], now)).toBe(96);
  });
});

describe('menu draft (V-05)', () => {
  const usual: UsualItem[] = Array.from({ length: 14 }, (_, i) => ({ id: `i${i}`, name: `Item ${i}`, defaultUnit: 'kg' }));
  const yesterday = usual.slice(0, 12).map((u, i) => ({ itemId: u.id, price: 30 + i, unit: 'kg' as const }));

  it('starts empty the first time', () => {
    const d = buildDraft(usual, null, null);
    expect(Object.values(d).every((x) => !x.selected && x.price === null)).toBe(true);
    expect(canPublish(d)).toBe(false);
  });
  it('"Same as yesterday" copies 12 items ready to publish', () => {
    const { draft, copied } = copyYesterday(buildDraft(usual, null, yesterday), yesterday);
    expect(copied).toBe(12);
    expect(canPublish(draft)).toBe(true);
    expect(toPublishItems(draft)).toHaveLength(12);
    expect(toPublishItems(draft)[0]).toEqual({ item_id: 'i0', price: 30, unit: 'kg' });
  });
  it('blocks publishing while a selected item has no price', () => {
    let d = buildDraft(usual, null, yesterday);
    d = toggleItem(d, 'i13');
    expect(missingPrices(d).map((x) => x.itemId)).toEqual(['i13']);
    expect(canPublish(d)).toBe(false);
    d = setPrice(d, 'i13', 25, 'bunch');
    expect(canPublish(d)).toBe(true);
  });
  it('keeps yesterday as the "was" hint', () => {
    const d = setPrice(buildDraft(usual, null, yesterday), 'i0', 40, 'kg');
    expect(d.i0).toMatchObject({ price: 40, wasPrice: 30 });
  });
  it('treats ₹0 and ₹1000 as invalid', () => {
    let d = setPrice(buildDraft(usual, null, null), 'i0', 0, 'kg');
    expect(canPublish(d)).toBe(false);
    d = setPrice(d, 'i0', 1000, 'kg');
    expect(canPublish(d)).toBe(false);
  });
});
