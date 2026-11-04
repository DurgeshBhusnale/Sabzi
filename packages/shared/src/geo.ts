import { LIMITS } from './constants.ts';

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (haversine) */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * VEN-6: pick the nearest candidate within `radius` metres of the device.
 * Returns null when nothing is close enough (vendor chooses manually).
 */
export function nearestWithin<T extends LatLng>(
  here: LatLng,
  candidates: readonly T[],
  radius: number = LIMITS.arrivalRadiusMeters,
): { item: T; distance: number } | null {
  let best: { item: T; distance: number } | null = null;
  for (const item of candidates) {
    const distance = distanceMeters(here, item);
    if (distance <= radius && (best === null || distance < best.distance)) {
      best = { item, distance };
    }
  }
  return best;
}

/** "180 m away" / "1.2 km away" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
