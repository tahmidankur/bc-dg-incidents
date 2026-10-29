import type { CountRow, Filters, MaterialCountRow, Meta } from "../types";

export const NOT_RECORDED = "Not recorded";

export const DEFAULT_FILTERS: Filters = {
  year: "",
  region: "",
  sector: "",
  eventType: "",
};

export function labelOf(value: string | null): string {
  return value ?? NOT_RECORDED;
}

type Categories = {
  region: string | null;
  sector: string | null;
  event_type: string | null;
};

function matchesCategories(row: Categories, filters: Filters): boolean {
  if (filters.region && labelOf(row.region) !== filters.region) {
    return false;
  }
  if (filters.sector && labelOf(row.sector) !== filters.sector) {
    return false;
  }
  if (filters.eventType && labelOf(row.event_type) !== filters.eventType) {
    return false;
  }
  return true;
}

// Reports without a usable date have no month, so they drop out as soon as a
// year is picked. That is intended: there is no way to know their year.
export function filterCounts(rows: CountRow[], filters: Filters): CountRow[] {
  return rows.filter((row) => {
    if (filters.year && !row.month?.startsWith(`${filters.year}-`)) {
      return false;
    }
    return matchesCategories(row, filters);
  });
}

export function filterMaterialCounts(
  rows: MaterialCountRow[],
  filters: Filters,
): MaterialCountRow[] {
  return rows.filter((row) => {
    if (filters.year && String(row.year) !== filters.year) {
      return false;
    }
    return matchesCategories(row, filters);
  });
}

export function categoryOptions(
  rows: CountRow[],
  key: keyof Categories,
): string[] {
  const labels = new Set<string>();
  let hasNotRecorded = false;
  for (const row of rows) {
    if (row[key] === null) {
      hasNotRecorded = true;
    } else {
      labels.add(row[key]);
    }
  }
  const options = [...labels].sort((a, b) => a.localeCompare(b));
  if (hasNotRecorded) {
    options.push(NOT_RECORDED);
  }
  return options;
}

export function yearOptions(meta: Meta): { value: string; label: string }[] {
  const firstYear = Number(meta.first_month.slice(0, 4));
  const lastYear = Number(meta.last_month.slice(0, 4));
  const options = [];
  for (let year = firstYear; year <= lastYear; year++) {
    const partial = meta.partial_years.includes(year);
    options.push({
      value: String(year),
      label: partial ? `${year} (partial)` : String(year),
    });
  }
  return options;
}
