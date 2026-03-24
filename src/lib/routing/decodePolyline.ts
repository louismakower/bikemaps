import { decode } from "@googlemaps/polyline-codec";
import type { LatLng } from "@/types/route";

export function decodePolyline(encoded: string): LatLng[] {
  return decode(encoded, 5).map(([lat, lng]) => ({ lat, lng }));
}
