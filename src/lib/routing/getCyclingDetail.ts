import type { CyclingLeg, LatLng } from "@/types/route";
import { decodePolyline } from "./decodePolyline";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/directions/json";

interface GoogleDirectionsResponse {
  status: string;
  routes: {
    overview_polyline: { points: string };
    legs: {
      duration: { value: number };
      distance: { value: number };
      start_address: string;
      end_address: string;
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
    }[];
  }[];
}

/**
 * Fetches a detailed cycling leg between two points using Google Directions API.
 * Only call this for the final selected routes (not during candidate enumeration).
 */
export async function getCyclingDetail(
  origin: LatLng,
  destination: LatLng,
  fromName: string,
  toName: string,
  id: string
): Promise<CyclingLeg> {
  const key = process.env.GOOGLE_SERVER_KEY;
  if (!key) throw new Error("GOOGLE_SERVER_KEY not set");

  const url =
    `${GOOGLE_BASE}?origin=${origin.lat},${origin.lng}` +
    `&destination=${destination.lat},${destination.lng}` +
    `&mode=bicycling&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Directions error: ${res.status}`);

  const data: GoogleDirectionsResponse = await res.json();

  if (data.status !== "OK" || !data.routes[0]) {
    throw new Error(`Google Directions status: ${data.status}`);
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  return {
    type: "cycling",
    id,
    durationMinutes: leg.duration.value / 60,
    distanceMeters: leg.distance.value,
    polylinePoints: decodePolyline(route.overview_polyline.points),
    from: fromName,
    to: toName,
    startLocation: { lat: leg.start_location.lat, lng: leg.start_location.lng },
    endLocation: { lat: leg.end_location.lat, lng: leg.end_location.lng },
  };
}
