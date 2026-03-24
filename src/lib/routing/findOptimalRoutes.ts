import type {
  LatLng,
  LatLngBounds,
  PlaceInput,
  RouteCandidate,
  RouteOption,
  RouteLabel,
  CyclingLeg,
  WalkingLeg,
  TflStation,
} from "@/types/route";
import { findNearbyStations } from "./findNearbyStations";
import {
  batchCyclingTimesFromOrigin,
  batchCyclingTimesToDestination,
} from "./batchCyclingTimes";
import { getTransitJourney } from "./getTransitJourney";
import { getTransitFare } from "./getTransitFare";
import { getCyclingDetail } from "./getCyclingDetail";
import { paretoFilter } from "./paretoFilter";
import {
  MAX_CYCLING_MINUTES,
  STATION_SEARCH_RADIUS_M,
  DEFAULT_PENCE_PER_MINUTE,
} from "./constants";

function computeBounds(
  origin: LatLng,
  destination: LatLng,
  extras: LatLng[] = []
): LatLngBounds {
  const all = [origin, destination, ...extras];
  return {
    northeast: {
      lat: Math.max(...all.map((p) => p.lat)),
      lng: Math.max(...all.map((p) => p.lng)),
    },
    southwest: {
      lat: Math.min(...all.map((p) => p.lat)),
      lng: Math.min(...all.map((p) => p.lng)),
    },
  };
}

function makeDummyCyclingLeg(
  id: string,
  from: LatLng,
  to: LatLng,
  fromName: string,
  toName: string,
  durationMinutes: number,
  distanceMeters: number
): CyclingLeg {
  return {
    type: "cycling",
    id,
    durationMinutes,
    distanceMeters,
    polylinePoints: [from, to],
    from: fromName,
    to: toName,
    startLocation: from,
    endLocation: to,
  };
}

export async function findOptimalRoutes(
  origin: PlaceInput,
  destination: PlaceInput,
  valuePencePerMinute: number = DEFAULT_PENCE_PER_MINUTE
): Promise<RouteOption[]> {
  // Step 1: Parallel — find nearby stations + get baseline transit route
  const [boardingStations, alightingStations, baselineResult] =
    await Promise.all([
      findNearbyStations(origin.location, STATION_SEARCH_RADIUS_M),
      findNearbyStations(destination.location, STATION_SEARCH_RADIUS_M),
      getBaselineRoute(origin, destination),
    ]);

  if (boardingStations.length === 0 || alightingStations.length === 0) {
    return [baselineResult];
  }

  // Step 2: Parallel — batch cycling times to/from stations
  const [cycleToBoarding, cycleFromAlighting] = await Promise.all([
    batchCyclingTimesFromOrigin(origin.location, boardingStations),
    batchCyclingTimesToDestination(alightingStations, destination.location),
  ]);

  // Step 3: Prune stations too far to cycle
  const viableBoarding = boardingStations
    .map((s, i) => ({ station: s, cycling: cycleToBoarding[i] }))
    .filter((x) => x.cycling.durationMinutes <= MAX_CYCLING_MINUTES);

  const viableAlighting = alightingStations
    .map((s, i) => ({ station: s, cycling: cycleFromAlighting[i] }))
    .filter((x) => x.cycling.durationMinutes <= MAX_CYCLING_MINUTES);

  if (viableBoarding.length === 0 || viableAlighting.length === 0) {
    return [baselineResult];
  }

  // Step 4: Build pairs and fetch transit data in parallel
  type Pair = {
    boarding: (typeof viableBoarding)[0];
    alighting: (typeof viableAlighting)[0];
  };

  const pairs: Pair[] = viableBoarding.flatMap((b) =>
    viableAlighting.map((a) => ({ boarding: b, alighting: a }))
  );

  const transitResults = await Promise.allSettled(
    pairs.map(({ boarding, alighting }) =>
      Promise.all([
        getTransitJourney(boarding.station.id, alighting.station.id),
        getTransitFare(boarding.station.id, alighting.station.id),
      ])
    )
  );

  // Step 5: Build candidates
  const candidates: RouteCandidate[] = transitResults
    .map((result, i) => {
      if (result.status === "rejected") return null;
      const [journey, farePence] = result.value;
      const { boarding, alighting } = pairs[i];

      const totalTimeMinutes =
        boarding.cycling.durationMinutes +
        journey.durationMinutes +
        alighting.cycling.durationMinutes;

      return {
        boardingStation: boarding.station,
        alightingStation: alighting.station,
        cycleToBoarding: {
          durationMinutes: boarding.cycling.durationMinutes,
          distanceMeters: boarding.cycling.distanceMeters,
        },
        cycleFromAlighting: {
          durationMinutes: alighting.cycling.durationMinutes,
          distanceMeters: alighting.cycling.distanceMeters,
        },
        transitDurationMinutes: journey.durationMinutes,
        farePence,
        totalTimeMinutes,
        transitLegs: journey.transitLegs,
      } satisfies RouteCandidate;
    })
    .filter((c): c is RouteCandidate => c !== null);

  if (candidates.length === 0) {
    return [baselineResult];
  }

  // Step 6: Pareto-filter
  const pareto = paretoFilter(candidates);

  // Step 7: Select labelled options
  const fastest = minBy(pareto, (c) => c.totalTimeMinutes)!;
  const cheapest = minBy(pareto, (c) => c.farePence)!;
  const bestValue = minBy(
    pareto,
    (c) => c.totalTimeMinutes + c.farePence / valuePencePerMinute
  )!;

  const selected = deduplicateCandidates([fastest, cheapest, bestValue]);

  // Step 8: Fetch detailed cycling polylines for selected options
  const routeOptions = await Promise.all(
    selected.map(async ({ candidate, label }) =>
      buildRouteOption(
        candidate,
        label,
        origin,
        destination,
        baselineResult.totalTimeMinutes,
        baselineResult.farePence
      )
    )
  );

  return [baselineResult, ...routeOptions];
}

async function buildRouteOption(
  candidate: RouteCandidate,
  label: RouteLabel,
  origin: PlaceInput,
  destination: PlaceInput,
  baselineTimeMinutes: number,
  baselineFarePence: number
): Promise<RouteOption> {
  const [cyclingLegStart, cyclingLegEnd] = await Promise.all([
    candidate.cycleToBoarding.durationMinutes > 0
      ? getCyclingDetail(
          origin.location,
          candidate.boardingStation.location,
          origin.description,
          candidate.boardingStation.name,
          `cycling-start-${candidate.boardingStation.id}`
        )
      : null,
    candidate.cycleFromAlighting.durationMinutes > 0
      ? getCyclingDetail(
          candidate.alightingStation.location,
          destination.location,
          candidate.alightingStation.name,
          destination.description,
          `cycling-end-${candidate.alightingStation.id}`
        )
      : null,
  ]);

  const legs = [
    ...(cyclingLegStart ? [cyclingLegStart] : []),
    ...candidate.transitLegs,
    ...(cyclingLegEnd ? [cyclingLegEnd] : []),
  ];

  // Use leg start/end locations for bounds (not polylinePoints — TfL paths can contain
  // invalid [0, 0] coordinates that would drag the bounding box to the Atlantic Ocean)
  const legEndpoints = legs.flatMap((l) => [l.startLocation, l.endLocation]);
  const bounds = computeBounds(origin.location, destination.location, legEndpoints);

  const cyclingDistanceMeters =
    (cyclingLegStart?.distanceMeters ?? 0) +
    (cyclingLegEnd?.distanceMeters ?? 0);

  return {
    label,
    legs,
    totalTimeMinutes: candidate.totalTimeMinutes,
    farePence: candidate.farePence,
    cyclingDistanceMeters,
    timeSavedVsBaseline: baselineTimeMinutes - candidate.totalTimeMinutes,
    moneySavedVsBaseline: baselineFarePence - candidate.farePence,
    bounds,
    boardingStation: candidate.boardingStation,
    alightingStation: candidate.alightingStation,
  };
}

async function getBaselineRoute(
  origin: PlaceInput,
  destination: PlaceInput
): Promise<RouteOption> {
  // Use origin/destination coordinates as "station" proxies for the baseline
  const fakeOriginStation: TflStation = {
    id: `${origin.location.lat},${origin.location.lng}`,
    name: origin.description,
    location: origin.location,
    modes: [],
  };
  const fakeDestStation: TflStation = {
    id: `${destination.location.lat},${destination.location.lng}`,
    name: destination.description,
    location: destination.location,
    modes: [],
  };

  let durationMinutes = 45;
  let farePence = 0;

  try {
    const [journey, fare] = await Promise.all([
      getTransitJourney(
        `${origin.location.lat},${origin.location.lng}`,
        `${destination.location.lat},${destination.location.lng}`
      ),
      getTransitFare(
        `${origin.location.lat},${origin.location.lng}`,
        `${destination.location.lat},${destination.location.lng}`
      ),
    ]);
    durationMinutes = journey.durationMinutes;
    farePence = fare;

    const transitEndpoints = journey.transitLegs.flatMap((l) => [
      l.startLocation,
      l.endLocation,
    ]);
    const bounds = computeBounds(
      origin.location,
      destination.location,
      transitEndpoints
    );

    // Add walking legs for baseline (simplified — show transit legs only)
    const walkStart: WalkingLeg = {
      type: "walking",
      id: "walk-start",
      durationMinutes: 5,
      distanceMeters: 400,
      polylinePoints: [],
      from: origin.description,
      to: "Station",
      startLocation: origin.location,
      endLocation: origin.location,
    };

    const walkEnd: WalkingLeg = {
      type: "walking",
      id: "walk-end",
      durationMinutes: 5,
      distanceMeters: 400,
      polylinePoints: [],
      from: "Station",
      to: destination.description,
      startLocation: destination.location,
      endLocation: destination.location,
    };

    return {
      label: "baseline",
      legs: [walkStart, ...journey.transitLegs, walkEnd],
      totalTimeMinutes: durationMinutes,
      farePence,
      cyclingDistanceMeters: 0,
      timeSavedVsBaseline: 0,
      moneySavedVsBaseline: 0,
      bounds,
      boardingStation: fakeOriginStation,
      alightingStation: fakeDestStation,
    };
  } catch {
    const bounds = computeBounds(origin.location, destination.location);
    return {
      label: "baseline",
      legs: [],
      totalTimeMinutes: durationMinutes,
      farePence,
      cyclingDistanceMeters: 0,
      timeSavedVsBaseline: 0,
      moneySavedVsBaseline: 0,
      bounds,
      boardingStation: fakeOriginStation,
      alightingStation: fakeDestStation,
    };
  }
}

function minBy<T>(arr: T[], fn: (x: T) => number): T | undefined {
  return arr.reduce((best, x) => (fn(x) < fn(best) ? x : best), arr[0]);
}

function deduplicateCandidates(
  labelled: RouteCandidate[]
): { candidate: RouteCandidate; label: RouteLabel }[] {
  const labels: RouteLabel[] = ["fastest", "cheapest", "best_value"];
  const seen = new Set<RouteCandidate>();
  const result: { candidate: RouteCandidate; label: RouteLabel }[] = [];

  labelled.forEach((candidate, i) => {
    if (!seen.has(candidate)) {
      seen.add(candidate);
      result.push({ candidate, label: labels[i] });
    }
  });

  return result;
}
