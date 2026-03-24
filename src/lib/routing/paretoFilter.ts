import type { RouteCandidate } from "@/types/route";

/**
 * Returns the Pareto-optimal subset of candidates on the (time, cost) dimensions.
 * A candidate is dominated if another candidate is strictly better on at least one
 * dimension and no worse on the other.
 */
export function paretoFilter(candidates: RouteCandidate[]): RouteCandidate[] {
  return candidates.filter((c) => !isDominated(c, candidates));
}

function isDominated(
  candidate: RouteCandidate,
  all: RouteCandidate[]
): boolean {
  return all.some(
    (other) =>
      other !== candidate &&
      other.totalTimeMinutes <= candidate.totalTimeMinutes &&
      other.farePence <= candidate.farePence &&
      (other.totalTimeMinutes < candidate.totalTimeMinutes ||
        other.farePence < candidate.farePence)
  );
}
