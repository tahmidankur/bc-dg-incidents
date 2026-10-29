import { describe, expect, it } from "vitest";
import countsJson from "../../public/data/counts.json";
import materialCountsJson from "../../public/data/material_counts.json";
import metaJson from "../../public/data/meta.json";
import type { CountRow, MaterialCountRow, Meta } from "../types";
import {
  countBy,
  countMaterialClasses,
  monthlyCounts,
  monthsToShow,
  topWithOther,
  totalReports,
} from "./counts";
import {
  DEFAULT_FILTERS,
  NOT_RECORDED,
  filterCounts,
  filterMaterialCounts,
  labelOf,
} from "./filters";

// These tests run on the generated JSON so they check the site against the SQL.
const counts = countsJson as CountRow[];
const materialCounts = materialCountsJson as MaterialCountRow[];
const meta = metaJson as Meta;

function sum(items: { reports: number }[]): number {
  return items.reduce((total, item) => total + item.reports, 0);
}

describe("with no filters", () => {
  const rows = filterCounts(counts, DEFAULT_FILTERS);

  it("matches the incident total in meta.json", () => {
    expect(totalReports(rows)).toBe(meta.incidents);
  });

  it("matches the SQL region counts", () => {
    const expected = meta.totals.region_counts.map((row) => ({
      label: labelOf(row.region),
      reports: row.reports,
    }));
    expect(countBy(rows, "region")).toEqual(expected);
  });

  it("matches the SQL monthly counts", () => {
    const months = monthsToShow(meta, "");
    const fromSite = monthlyCounts(rows, months).filter((m) => m.reports > 0);
    const fromSql = meta.totals.monthly_counts.map((row) => ({
      label: row.month,
      reports: row.reports,
    }));
    expect(fromSite).toEqual(fromSql);
  });

  it("matches the SQL substance class counts", () => {
    const fromSite = countMaterialClasses(
      filterMaterialCounts(materialCounts, DEFAULT_FILTERS),
    );
    expect(sum(fromSite)).toBe(sum(meta.totals.material_mentions));
    expect(fromSite[0].label).toBe(
      meta.totals.material_mentions[0].material_class,
    );
  });
});

describe("filtering by region", () => {
  const northern = filterCounts(counts, {
    ...DEFAULT_FILTERS,
    region: "Northern",
  });

  it("changes the total to that region's SQL count", () => {
    const expected = meta.totals.region_counts.find(
      (row) => row.region === "Northern",
    );
    expect(totalReports(northern)).toBe(expected?.reports);
    expect(totalReports(northern)).toBeLessThan(meta.incidents);
  });

  it("changes the monthly counts", () => {
    const months = monthsToShow(meta, "");
    const all = monthlyCounts(counts, months);
    const filtered = monthlyCounts(northern, months);
    expect(filtered).not.toEqual(all);
    for (let i = 0; i < months.length; i++) {
      expect(filtered[i].reports).toBeLessThanOrEqual(all[i].reports);
    }
  });

  it("can select reports with no region recorded", () => {
    const rows = filterCounts(counts, {
      ...DEFAULT_FILTERS,
      region: NOT_RECORDED,
    });
    const expected = meta.totals.region_counts.find(
      (row) => row.region === null,
    );
    expect(totalReports(rows)).toBe(expected?.reports);
  });
});

describe("filtering by year", () => {
  it("leaves out reports with no usable date", () => {
    const rows = filterCounts(counts, { ...DEFAULT_FILTERS, year: "2023" });
    expect(rows.every((row) => row.month?.startsWith("2023-"))).toBe(true);
  });

  it("shows only that year's months, starting at November for 2020", () => {
    expect(monthsToShow(meta, "2020")).toEqual(["2020-11", "2020-12"]);
    expect(monthsToShow(meta, "2023")).toHaveLength(12);
  });
});

describe("topWithOther", () => {
  it("groups everything after the limit into one Other row", () => {
    const items = [
      { label: "A", reports: 5 },
      { label: "B", reports: 3 },
      { label: "C", reports: 2 },
      { label: "D", reports: 1 },
    ];
    expect(topWithOther(items, 2)).toEqual([
      { label: "A", reports: 5 },
      { label: "B", reports: 3 },
      { label: "Other (2 categories)", reports: 3 },
    ]);
  });
});
