import type { LatLng, TflStation } from "@/types/route";
import { STATION_SEARCH_RADIUS_M, MAX_BOARDING_STATIONS } from "./constants";

const TFL_BASE = "https://api.tfl.gov.uk";

// Stop types covering tube, overground, Elizabeth line, national rail
const STOP_TYPES = [
  "NaptanMetroStation",
  "NaptanRailStation",
].join(",");

interface TflStopPointResult {
  naptanId: string;
  commonName: string;
  lat: number;
  lon: number;
  modes: string[];
}

interface TflStopPointResponse {
  stopPoints: TflStopPointResult[];
}

function tflUrl(path: string): string {
  const key = process.env.TFL_APP_KEY;
  return `${TFL_BASE}${path}${key ? `&app_key=${key}` : ""}`;
}

export async function findNearbyStations(
  location: LatLng,
  radiusM: number = STATION_SEARCH_RADIUS_M
): Promise<TflStation[]> {
  const url = tflUrl(
    `/StopPoint?lat=${location.lat}&lon=${location.lng}&radius=${radiusM}&stopTypes=${STOP_TYPES}&modes=tube,overground,elizabeth-line,national-rail`
  );

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TfL StopPoint API error: ${res.status} ${res.statusText}`);
  }

  const data: TflStopPointResponse = await res.json();

  return (data.stopPoints ?? [])
    .slice(0, MAX_BOARDING_STATIONS)
    .map((s) => ({
      id: s.naptanId,
      name: s.commonName.replace(/ Underground Station| Rail Station| Station$/, ""),
      location: { lat: s.lat, lng: s.lon },
      modes: s.modes ?? [],
    }));
}
