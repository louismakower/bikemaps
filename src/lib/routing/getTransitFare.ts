const TFL_BASE = "https://api.tfl.gov.uk";

interface TflFareResponse {
  travelCards?: { cost?: string }[];
  singleFare?: { cost?: string };
  passengerType?: string;
}

/**
 * Returns the single fare in pence between two TfL stations.
 * Uses /StopPoint/{from}/FareTo/{to} endpoint.
 */
export async function getTransitFare(
  fromId: string,
  toId: string
): Promise<number> {
  const key = process.env.TFL_APP_KEY;
  const keyParam = key ? `?app_key=${key}` : "";

  const url = `${TFL_BASE}/StopPoint/${encodeURIComponent(fromId)}/FareTo/${encodeURIComponent(toId)}${keyParam}`;

  const res = await fetch(url, { next: { revalidate: 86400 } }); // fares change rarely
  if (!res.ok) {
    // Fare API can fail for some station pairs — return 0 as fallback
    console.warn(`TfL FareTo API error for ${fromId} → ${toId}: ${res.status}`);
    return 0;
  }

  const data: TflFareResponse[] = await res.json();

  // Find the adult single fare
  const adultFare = data.find(
    (d) => !d.passengerType || d.passengerType.toLowerCase() === "adult"
  );

  const costStr = adultFare?.singleFare?.cost ?? adultFare?.travelCards?.[0]?.cost;
  if (!costStr) return 0;

  // Cost is returned as a string like "2.10" (pounds) — convert to pence
  const parsed = parseFloat(costStr);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}
