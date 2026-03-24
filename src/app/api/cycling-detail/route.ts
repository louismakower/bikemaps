import { NextRequest, NextResponse } from "next/server";
import { getCyclingDetail } from "@/lib/routing/getCyclingDetail";
import type { LatLng } from "@/types/route";

interface CyclingDetailRequest {
  origin: LatLng;
  destination: LatLng;
  fromName: string;
  toName: string;
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CyclingDetailRequest = await req.json();

    if (!body.origin || !body.destination) {
      return NextResponse.json(
        { error: "origin and destination are required" },
        { status: 400 }
      );
    }

    const leg = await getCyclingDetail(
      body.origin,
      body.destination,
      body.fromName ?? "Origin",
      body.toName ?? "Destination",
      body.id ?? "cycling-leg"
    );

    return NextResponse.json(leg);
  } catch (err) {
    console.error("Cycling detail error:", err);
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : "Failed to get cycling route",
        },
      },
      { status: 500 }
    );
  }
}
