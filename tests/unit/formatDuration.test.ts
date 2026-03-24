import { describe, it, expect } from "vitest";
import { formatDuration } from "@/lib/utils/formatDuration";

describe("formatDuration", () => {
  it("formats sub-minute durations", () => {
    expect(formatDuration(0)).toBe("< 1 min");
    expect(formatDuration(0.5)).toBe("< 1 min");
  });

  it("formats minute-only durations", () => {
    expect(formatDuration(1)).toBe("1 min");
    expect(formatDuration(38)).toBe("38 min");
    expect(formatDuration(59)).toBe("59 min");
  });

  it("formats hour durations", () => {
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(120)).toBe("2 hr");
  });

  it("formats hour + minute durations", () => {
    expect(formatDuration(65)).toBe("1 hr 5 min");
    expect(formatDuration(90)).toBe("1 hr 30 min");
  });
});
