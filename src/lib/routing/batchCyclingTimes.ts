import type { LatLng, TflStation } from "@/types/route";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/distancematrix/json";

export interface CyclingTime {
  stationId: string;
  durationMinutes: number;
  distanceMeters: number;
}

interface GoogleDistanceMatrixRow {
  elements: {
    status: string;
    duration?: { value: number };
    distance?: { value: number };
  }[];
}

interface GoogleDistanceMatrixResponse {
  status: string;
  rows: GoogleDistanceMatrixRow[];
}

/**
 * Batch cycling times from a single origin to multiple station destinations.
 * Uses one Distance Matrix API call instead of N Directions API calls.
 */
export async function batchCyclingTimesFromOrigin(
  origin: LatLng,
  stations: TflStation[]
): Promise<CyclingTime[]> {
  if (stations.length === 0) return [];
  return batchCyclingTimes(
    `${origin.lat},${origin.lng}`,
    stations.map((s) => `${s.location.lat},${s.location.lng}`),
    stations.map((s) => s.id)
  );
}

/**
 * Batch cycling times from multiple station origins to a single destination.
 */
export async function batchCyclingTimesToDestination(
  stations: TflStation[],
  destination: LatLng
): Promise<CyclingTime[]> {
  if (stations.length === 0) return [];
  return batchCyclingTimes(
    stations.map((s) => `${s.location.lat},${s.location.lng}`).join("|"),
    [`${destination.lat},${destination.lng}`],
    stations.map((s) => s.id),
    true
  );
}

async function batchCyclingTimes(
  origins: string | string[],
  destinations: string[],
  stationIds: string[],
  originsAreStations = false
): Promise<CyclingTime[]> {
  const key = process.env.GOOGLE_SERVER_KEY;
  if (!key) throw new Error("GOOGLE_SERVER_KEY not set");

  const originsStr = Array.isArray(origins) ? origins.join("|") : origins;
  const destinationsStr = destinations.join("|");

  const url =
    `${GOOGLE_BASE}?origins=${encodeURIComponent(originsStr)}` +
    `&destinations=${encodeURIComponent(destinationsStr)}` +
    `&mode=bicycling&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Distance Matrix error: ${res.status}`);
  }

  const data: GoogleDistanceMatrixResponse = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Google Distance Matrix status: ${data.status}`);
  }

  return stationIds.map((id, i) => {
    // If origins are stations: each station = one row, one destination column
    // If destinations are stations: single origin row, each station = one column
    const element = originsAreStations
      ? data.rows[i]?.elements[0]
      : data.rows[0]?.elements[i];

    if (!element || element.status !== "OK") {
      return { stationId: id, durationMinutes: Infinity, distanceMeters: Infinity };
    }

    return {
      stationId: id,
      durationMinutes: (element.duration!.value ?? 0) / 60,
      distanceMeters: element.distance!.value ?? 0,
    };
  });
}
