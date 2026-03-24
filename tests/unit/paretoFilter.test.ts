import { describe, it, expect } from "vitest";
import { paretoFilter } from "@/lib/routing/paretoFilter";
import type { RouteCandidate } from "@/types/route";

function makeCandidate(
  totalTimeMinutes: number,
  farePence: number
): RouteCandidate {
  return {
    boardingStation: {
      id: `b-${totalTimeMinutes}`,
      name: "Boarding",
      location: { lat: 0, lng: 0 },
      modes: [],
    },
    alightingStation: {
      id: `a-${farePence}`,
      name: "Alighting",
      location: { lat: 0, lng: 0 },
      modes: [],
    },
    cycleToBoarding: { durationMinutes: 5, distanceMeters: 500 },
    cycleFromAlighting: { durationMinutes: 3, distanceMeters: 300 },
    transitDurationMinutes: totalTimeMinutes - 8,
    farePence,
    totalTimeMinutes,
    transitLegs: [],
  };
}

describe("paretoFilter", () => {
  it("returns all candidates when none are dominated", () => {
    // A is faster, B is cheaper — neither dominates the other
    const a = makeCandidate(30, 300);
    const b = makeCandidate(45, 100);
    expect(paretoFilter([a, b])).toHaveLength(2);
  });

  it("removes a dominated candidate", () => {
    // A is strictly better than C on both dimensions
    const a = makeCandidate(30, 200);
    const b = makeCandidate(45, 100);
    const c = makeCandidate(50, 350); // dominated by both a and b
    const result = paretoFilter([a, b, c]);
    expect(result).not.toContain(c);
    expect(result).toContain(a);
    expect(result).toContain(b);
  });

  it("keeps a candidate that is only cheaper (even if slower)", () => {
    const fast = makeCandidate(25, 400);
    const cheap = makeCandidate(45, 80);
    const result = paretoFilter([fast, cheap]);
    expect(result).toHaveLength(2);
  });

  it("removes a candidate dominated on one dimension with equal other", () => {
    const a = makeCandidate(30, 200);
    const b = makeCandidate(30, 250); // same time, higher fare → dominated by a
    const result = paretoFilter([a, b]);
    expect(result).toContain(a);
    expect(result).not.toContain(b);
  });

  it("handles empty array", () => {
    expect(paretoFilter([])).toEqual([]);
  });

  it("handles single candidate", () => {
    const a = makeCandidate(30, 200);
    expect(paretoFilter([a])).toEqual([a]);
  });

  it("keeps the Richmond → Imperial optimised route over the naive one", () => {
    // Simulates: naive = walk Richmond → tube → walk to Imperial (45 min, 350p)
    // Optimised = cycle Kew Gardens → tube → cycle to Imperial (38 min, 210p)
    const naive = makeCandidate(45, 350);
    const optimised = makeCandidate(38, 210);
    const result = paretoFilter([naive, optimised]);
    expect(result).not.toContain(naive);
    expect(result).toContain(optimised);
  });
});
