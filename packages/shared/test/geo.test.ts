import { describe, expect, it } from 'vitest';
import { distanceMeters, formatDistance, nearestWithin } from '../src/geo.ts';

describe('geo', () => {
  const greenParkGate1 = { id: 'gp1', lat: 18.4895, lng: 73.8215 };
  const sahyadriMain = { id: 'sh', lat: 18.4935, lng: 73.8186 };

  it('measures distance', () => {
    const d = distanceMeters(greenParkGate1, sahyadriMain);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(600);
    expect(distanceMeters(greenParkGate1, greenParkGate1)).toBe(0);
  });

  it('picks the nearest gate within 300 m', () => {
    // ~180 m north of Green Park Gate 1
    const here = { lat: 18.4911, lng: 73.8215 };
    const found = nearestWithin(here, [sahyadriMain, greenParkGate1]);
    expect(found?.item.id).toBe('gp1');
    expect(found!.distance).toBeGreaterThan(170);
    expect(found!.distance).toBeLessThan(190);
  });

  it('returns null when nothing within 300 m', () => {
    const far = { lat: 18.5, lng: 73.84 };
    expect(nearestWithin(far, [greenParkGate1, sahyadriMain])).toBeNull();
  });

  it('formats distances', () => {
    expect(formatDistance(183)).toBe('180 m');
    expect(formatDistance(1234)).toBe('1.2 km');
  });
});
