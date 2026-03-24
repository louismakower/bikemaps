import { NextRequest, NextResponse } from "next/server";
import { findOptimalRoutes } from "@/lib/routing/findOptimalRoutes";
import type { RouteSearchRequest } from "@/types/route";

export async function POST(req: NextRequest) {
  try {
    const body: RouteSearchRequest = await req.json();

    if (!body.origin?.location || !body.destination?.location) {
      return NextResponse.json(
        { error: "origin and destination with location are required" },
        { status: 400 }
      );
    }

    const { baseline, paretoOptions } = await findOptimalRoutes(
      body.origin,
      body.destination,
    );

    return NextResponse.json({ baseline, paretoOptions });
  } catch (err) {
    console.error("Route search error:", err);
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : "Failed to calculate routes",
        },
      },
      { status: 500 }
    );
  }
}
