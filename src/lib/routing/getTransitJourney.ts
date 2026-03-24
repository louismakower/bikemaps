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

      const startLoc: LatLng = { lat: leg.departurePoint.lat, lng: leg.departurePoint.lon };
      const endLoc: LatLng = { lat: leg.arrivalPoint.lat, lng: leg.arrivalPoint.lon };

      let polylinePoints: LatLng[] = [];
      if (leg.path?.lineString) {
        try {
          // TfL returns coordinates as a JSON string: [[lat, lng], ...]
          const coords: [number, number][] = JSON.parse(leg.path.lineString);
          const decoded = coords
            .map(([lat, lng]) => ({ lat, lng }))
            .filter((p) => Math.abs(p.lat) > 0.01 && Math.abs(p.lng) > 0.01);
          if (decoded.length >= 2) polylinePoints = decoded;
        } catch {
          // fall through to straight-line fallback
        }
      }

      // Fall back to a straight line between boarding and alighting stops so
      // transit legs always appear on the map even when TfL omits path data
      if (polylinePoints.length < 2) {
        polylinePoints = [startLoc, endLoc];
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
        startLocation: startLoc,
        endLocation: endLoc,
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
