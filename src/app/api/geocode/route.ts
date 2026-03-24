import { NextRequest, NextResponse } from "next/server";
import type { LatLng } from "@/types/route";

const GOOGLE_BASE =
  "https://maps.googleapis.com/maps/api/place/details/json";

interface GooglePlaceDetailsResponse {
  status: string;
  result: {
    geometry: { location: { lat: number; lng: number } };
    formatted_address: string;
    name: string;
  };
}

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const key = process.env.GOOGLE_SERVER_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_SERVER_KEY not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "geometry,name,formatted_address",
    key,
  });

  const res = await fetch(`${GOOGLE_BASE}?${params}`);
  if (!res.ok) {
    return NextResponse.json(
      { error: `Google Place Details error: ${res.status}` },
      { status: 500 }
    );
  }

  const data: GooglePlaceDetailsResponse = await res.json();

  if (data.status !== "OK") {
    return NextResponse.json(
      { error: `Google Place Details status: ${data.status}` },
      { status: 400 }
    );
  }

  const location: LatLng = {
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
  };

  return NextResponse.json({
    location,
    name: data.result.name,
    formattedAddress: data.result.formatted_address,
  });
}
