import { NextRequest, NextResponse } from "next/server";
import type { AutocompletePrediction } from "@/types/route";

const GOOGLE_BASE = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoogleAutocompleteResponse {
  status: string;
  predictions: GoogleAutocompletePrediction[];
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");
  const sessiontoken = req.nextUrl.searchParams.get("sessiontoken");

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const key = process.env.GOOGLE_SERVER_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_SERVER_KEY not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    input: input.trim(),
    key,
    components: "country:gb",
    language: "en",
    ...(sessiontoken ? { sessiontoken } : {}),
  });

  try {
    const res = await fetch(`${GOOGLE_BASE}?${params}`, {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Google Autocomplete error: ${res.status}`);
    }

    const data: GoogleAutocompleteResponse = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Autocomplete status: ${data.status}`);
    }

    const predictions: AutocompletePrediction[] = (
      data.predictions ?? []
    )
      .slice(0, 5)
      .map((p) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting.main_text,
        secondaryText: p.structured_formatting.secondary_text,
      }));

    return NextResponse.json({ predictions });
  } catch (err) {
    console.error("Autocomplete error:", err);
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : "Autocomplete failed",
        },
      },
      { status: 500 }
    );
  }
}
