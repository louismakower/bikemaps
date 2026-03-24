import { describe, it, expect } from "vitest";
import { formatPence } from "@/lib/utils/formatCurrency";

describe("formatPence", () => {
  it("formats sub-pound amounts as pence", () => {
    expect(formatPence(50)).toBe("50p");
    expect(formatPence(99)).toBe("99p");
  });

  it("formats pound amounts with 2 decimal places", () => {
    expect(formatPence(100)).toBe("£1.00");
    expect(formatPence(210)).toBe("£2.10");
    expect(formatPence(350)).toBe("£3.50");
  });

  it("formats zero as pence", () => {
    expect(formatPence(0)).toBe("0p");
  });
});
