import type { Place } from './types.ts';

const EARTH_RADIUS_KM = 6371;

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s));
}

export interface PlaceWithDistance extends Place {
  distanceKm: number;
}

/** 372곳 전부를 훑어도 1ms 아래다. 공간 인덱스를 둘 이유가 없다. */
export function nearest(places: Place[], lat: number, lng: number, limit = 20): PlaceWithDistance[] {
  return places
    .map((p) => ({ ...p, distanceKm: distanceKm(lat, lng, p.lat, p.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
