export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeofenceResult {
  isWithin: boolean;
  distanceMeters: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);

  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLng * sinHalfLng;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isWithinRadius(
  userLoc: Coordinates,
  siteLoc: Coordinates,
  radiusMeters: number,
): boolean {
  return getDistanceMeters(userLoc, siteLoc) <= radiusMeters;
}

export function checkGeofence(
  userLoc: Coordinates,
  siteLoc: Coordinates,
  radiusMeters = 500,
): GeofenceResult {
  const distanceMeters = getDistanceMeters(userLoc, siteLoc);
  return {
    isWithin: distanceMeters <= radiusMeters,
    distanceMeters: Math.round(distanceMeters),
  };
}
