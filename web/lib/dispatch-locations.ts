export type DispatchStop = {
  name: string;
  label: string;
  lat: number;
  lng: number;
};

/** Mock route endpoints — La Trinidad (origin) → Divisoria (destination). */
export const LA_TRINIDAD: DispatchStop = {
  name: "La Trinidad",
  label: "origin · distributor",
  lat: 16.4551,
  lng: 120.5875,
};

export const DIVISORIA: DispatchStop = {
  name: "Divisoria",
  label: "destination · wholesaler",
  lat: 14.6042,
  lng: 120.9722,
};

export const KNOWN_DESTINATIONS: Record<string, DispatchStop> = {
  Divisoria: DIVISORIA,
  Balintawak: { name: "Balintawak", label: "destination · wholesaler", lat: 14.6572, lng: 121.0031 },
  Makati: { name: "Makati", label: "destination · wholesaler", lat: 14.5547, lng: 121.0244 },
  Cubao: { name: "Cubao", label: "destination · wholesaler", lat: 14.6186, lng: 121.0567 },
};

export function resolveDestination(name: string): DispatchStop {
  return KNOWN_DESTINATIONS[name] ?? { ...DIVISORIA, name };
}

/** Haversine distance in kilometres. */
export function distanceKm(a: DispatchStop, b: DispatchStop): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export type LatLngTuple = [number, number];

/** Fetch driving route from OSRM; falls back to a straight interpolated line. */
export async function fetchRoutePolyline(
  origin: DispatchStop,
  destination: DispatchStop
): Promise<LatLngTuple[]> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM unavailable");
    const data = await res.json();
    const line: number[][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
    if (!line?.length) throw new Error("No route geometry");
    return line.map(([lng, lat]) => [lat, lng] as LatLngTuple);
  } catch {
    return interpolateRoute(origin, destination, 48);
  }
}

function interpolateRoute(
  origin: DispatchStop,
  destination: DispatchStop,
  steps: number
): LatLngTuple[] {
  const pts: LatLngTuple[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([
      origin.lat + (destination.lat - origin.lat) * t,
      origin.lng + (destination.lng - origin.lng) * t,
    ]);
  }
  return pts;
}

/** Point along polyline at fraction 0–1. */
export function pointAlongRoute(route: LatLngTuple[], fraction: number): LatLngTuple {
  if (route.length < 2) return route[0] ?? [0, 0];
  const clamped = Math.max(0, Math.min(1, fraction));
  const total = route.length - 1;
  const pos = clamped * total;
  const idx = Math.floor(pos);
  const t = pos - idx;
  const a = route[Math.min(idx, route.length - 1)];
  const b = route[Math.min(idx + 1, route.length - 1)];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
