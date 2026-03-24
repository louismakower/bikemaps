import type { TransitLeg, LatLng } from "@/types/route";
import { decodePolyline } from "./decodePolyline";

const TFL_BASE = "https://api.tfl.gov.uk";

interface TflJourneyResponse {
  journeys?: TflJourney[];
}

interface TflJourney {
  duration: number; // minutes
  legs: TflLeg[];
}

interface TflLeg {
  duration: number; // minutes
  mode: { id: string; name: string };
  instruction: { summary: string };
  departurePoint: { commonName: string; lat: number; lon: number };
  arrivalPoint: { commonName: string; lat: number; lon: number };
  departureTime?: string;
  arrivalTime?: string;
  path?: { lineString?: string };
  routeOptions?: { lineIdentifier?: { id?: string; name?: string } }[];
  stopPoints?: unknown[];
  distance?: number;
}

interface TransitJourneyResult {
  durationMinutes: number;
  transitLegs: TransitLeg[];
}

export async function getTransitJourney(
  fromId: string,
  toId: string
): Promise<TransitJourneyResult> {
  const key = process.env.TFL_APP_KEY;
  const keyParam = key ? `&app_key=${key}` : "";

  const url =
    `${TFL_BASE}/Journey/JourneyResults/${encodeURIComponent(fromId)}/to/${encodeURIComponent(toId)}` +
    `?mode=tube,overground,elizabeth-line,national-rail&walkingOptimization=false${keyParam}`;

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`TfL Journey Planner error: ${res.status} ${res.statusText}`);
  }

  const data: TflJourneyResponse = await res.json();
  const journey = data.journeys?.[0];

  if (!journey) {
    throw new Error("No journey found between stations");
  }

  const transitLegs: TransitLeg[] = journey.legs
    .filter((leg) => leg.mode.id !== "walking")
    .map((leg, i) => {
      const lineId = leg.routeOptions?.[0]?.lineIdentifier?.id ?? "";
      const lineName = leg.routeOptions?.[0]?.lineIdentifier?.name ?? leg.mode.name;
      const lineColor = tflLineColor(lineId);

      let polylinePoints: LatLng[] = [];
      if (leg.path?.lineString) {
        try {
          // TfL returns GeoJSON-style coordinates as a JSON string
          const coords: [number, number][] = JSON.parse(leg.path.lineString);
          polylinePoints = coords.map(([lng, lat]) => ({ lat, lng }));
        } catch {
          // ignore bad polyline
        }
      }

      const numStops = Array.isArray(leg.stopPoints) ? leg.stopPoints.length : 0;

      return {
        type: "transit" as const,
        id: `transit-${i}`,
        durationMinutes: leg.duration,
        distanceMeters: leg.distance ?? 0,
        polylinePoints,
        line: lineName,
        lineColor,
        boardingStop: leg.departurePoint.commonName,
        alightingStop: leg.arrivalPoint.commonName,
        numStops,
        departureTime: leg.departureTime ?? "",
        arrivalTime: leg.arrivalTime ?? "",
        startLocation: { lat: leg.departurePoint.lat, lng: leg.departurePoint.lon },
        endLocation: { lat: leg.arrivalPoint.lat, lng: leg.arrivalPoint.lon },
      };
    });

  return {
    durationMinutes: journey.duration,
    transitLegs,
  };
}

// TfL line colours (official brand colours)
function tflLineColor(lineId: string): string {
  const colours: Record<string, string> = {
    bakerloo: "#B36305",
    central: "#E32017",
    circle: "#FFD300",
    district: "#00782A",
    "hammersmith-city": "#F3A9BB",
    jubilee: "#A0A5A9",
    metropolitan: "#9B0056",
    northern: "#000000",
    piccadilly: "#003688",
    victoria: "#0098D4",
    "waterloo-city": "#95CDBA",
    "elizabeth-line": "#6950A1",
    overground: "#EE7C0E",
    dlr: "#00A4A7",
  };
  return colours[lineId.toLowerCase()] ?? "#3b82f6";
}
