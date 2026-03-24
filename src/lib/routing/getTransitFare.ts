const TFL_BASE = "https://api.tfl.gov.uk";

interface TflFaresSection {
  rows?: {
    passengerType?: string;
    ticketsAvailable?: {
      passengerType?: string;
      ticketType?: { type?: string };
      cost?: string;
    }[];
  }[];
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
    console.warn(`TfL FareTo API error for ${fromId} → ${toId}: ${res.status}`);
    return 0;
  }

  const data: TflFaresSection[] = await res.json();

  // Collect all adult tickets, prefer Oyster/contactless over cash
  const preferred = ["pay as you go", "oyster", "contactless", "offpeak", "off peak"];
  let bestCost = Infinity;
  let cashCost = Infinity;

  for (const section of data) {
    for (const row of section.rows ?? []) {
      if (row.passengerType && row.passengerType.toLowerCase() !== "adult") continue;
      for (const ticket of row.ticketsAvailable ?? []) {
        if (!ticket.cost) continue;
        const parsed = parseFloat(ticket.cost);
        if (isNaN(parsed)) continue;
        const type = (ticket.ticketType?.type ?? "").toLowerCase();
        if (preferred.some((p) => type.includes(p))) {
          bestCost = Math.min(bestCost, parsed);
        } else {
          cashCost = Math.min(cashCost, parsed);
        }
      }
    }
  }

  const fare = bestCost < Infinity ? bestCost : cashCost < Infinity ? cashCost : 0;
  return Math.round(fare * 100);
}
