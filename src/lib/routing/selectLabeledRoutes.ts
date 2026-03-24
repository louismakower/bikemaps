import type { RouteOption, RouteLabel } from "@/types/route";

function minBy<T>(arr: T[], fn: (x: T) => number): T | undefined {
  return arr.reduce((best, x) => (fn(x) < fn(best) ? x : best), arr[0]);
}

/**
 * Client-side label selection from Pareto-optimal routes.
 * Returns baseline + up to 3 labeled options (fastest, cheapest, best_value), deduplicated.
 */
export function selectLabeledRoutes(
  baseline: RouteOption,
  paretoOptions: RouteOption[],
  valuePencePerMinute: number
): RouteOption[] {
  if (paretoOptions.length === 0) {
    return [{ ...baseline, label: "baseline" }];
  }

  const fastest = minBy(paretoOptions, (c) => c.totalTimeMinutes)!;
  const cheapest = minBy(paretoOptions, (c) => c.farePence)!;
  const bestValue = minBy(
    paretoOptions,
    (c) => c.totalTimeMinutes + c.farePence / valuePencePerMinute
  )!;

  const labels: RouteLabel[] = ["fastest", "cheapest", "best_value"];
  const candidates = [fastest, cheapest, bestValue];
  const seen = new Set<RouteOption>();
  const result: RouteOption[] = [{ ...baseline, label: "baseline" }];

  candidates.forEach((candidate, i) => {
    if (!seen.has(candidate)) {
      seen.add(candidate);
      result.push({ ...candidate, label: labels[i] });
    }
  });

  return result;
}
