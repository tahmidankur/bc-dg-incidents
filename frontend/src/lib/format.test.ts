import { describe, expect, it } from "vitest";
import { formatDate, formatPercent } from "./format";

describe("format", () => {
  it("shows dates in en-CA medium style without shifting the day", () => {
    expect(formatDate("2026-10-28")).toBe("Oct 28, 2026");
  });

  it("returns 0% instead of dividing by zero", () => {
    expect(formatPercent(0, 0)).toBe("0%");
  });

  it("doesn't round a few reports down to 0.0%", () => {
    expect(formatPercent(5, 10000)).toBe("under 0.1%");
    expect(formatPercent(90, 10000)).toBe("0.9%");
  });
});
