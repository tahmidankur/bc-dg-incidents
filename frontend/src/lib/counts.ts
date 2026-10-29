import type { CountRow, LabelCount, MaterialCountRow, Meta } from "../types";
import { NOT_RECORDED, labelOf } from "./filters";

export function totalReports(rows: CountRow[]): number {
  let total = 0;
  for (const row of rows) {
    total += row.reports;
  }
  return total;
}

export function reportsWithLocation(rows: CountRow[]): number {
  let total = 0;
  for (const row of rows) {
    total += row.reports_with_location;
  }
  return total;
}

export function reportsWithoutDate(rows: CountRow[]): number {
  let total = 0;
  for (const row of rows) {
    if (row.month === null) {
      total += row.reports;
    }
  }
  return total;
}

function nextMonth(month: string): string {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  if (monthNumber === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(monthNumber + 1).padStart(2, "0")}`;
}

// Every month from the first to the last month of the snapshot, or only the
// months of one year. Months before WebEOC started are never shown as zero.
export function monthsToShow(meta: Meta, year: string): string[] {
  const months = [];
  let month = meta.first_month;
  while (month <= meta.last_month) {
    if (!year || month.startsWith(`${year}-`)) {
      months.push(month);
    }
    month = nextMonth(month);
  }
  return months;
}

export function monthlyCounts(
  rows: CountRow[],
  months: string[],
): LabelCount[] {
  const byMonth = new Map<string, number>();
  for (const row of rows) {
    if (row.month !== null) {
      byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + row.reports);
    }
  }
  return months.map((month) => ({
    label: month,
    reports: byMonth.get(month) ?? 0,
  }));
}

function sortByReports(totals: Map<string, number>): LabelCount[] {
  const items = [...totals].map(([label, reports]) => ({ label, reports }));
  // Biggest first, but "Not recorded" always goes last so it isn't read as a category.
  items.sort((a, b) => {
    if (a.label === NOT_RECORDED) return 1;
    if (b.label === NOT_RECORDED) return -1;
    return b.reports - a.reports || a.label.localeCompare(b.label);
  });
  return items;
}

export function countBy(
  rows: CountRow[],
  key: "region" | "sector" | "event_type",
): LabelCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = labelOf(row[key]);
    totals.set(label, (totals.get(label) ?? 0) + row.reports);
  }
  return sortByReports(totals);
}

export function countMaterialClasses(rows: MaterialCountRow[]): LabelCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(
      row.material_class,
      (totals.get(row.material_class) ?? 0) + row.reports,
    );
  }
  return sortByReports(totals);
}

export function topWithOther(items: LabelCount[], limit: number): LabelCount[] {
  if (items.length <= limit) {
    return items;
  }
  const top = items.slice(0, limit);
  const rest = items.slice(limit);
  let otherReports = 0;
  for (const item of rest) {
    otherReports += item.reports;
  }
  top.push({
    label: `Other (${rest.length} categories)`,
    reports: otherReports,
  });
  return top;
}
