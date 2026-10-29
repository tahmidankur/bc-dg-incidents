const numberFormat = new Intl.NumberFormat("en-CA");
const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" });
const monthFormat = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  year: "numeric",
});
const longMonthFormat = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  year: "numeric",
});

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatPercent(part: number, whole: number): string {
  if (whole === 0 || part === 0) {
    return "0%";
  }
  const percent = (part / whole) * 100;
  // A handful of reports out of thousands would round to 0.0%, which reads as none.
  if (percent < 0.1) {
    return "under 0.1%";
  }
  return `${percent.toFixed(1)}%`;
}

// Dates are built from their parts so the browser's time zone can't shift
// "2026-10-28" to the day before.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return dateFormat.format(new Date(year, month - 1, day));
}

export function formatMonth(
  month: string,
  style: "short" | "long" = "short",
): string {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1);
  return style === "short"
    ? monthFormat.format(date)
    : longMonthFormat.format(date);
}

export function formatMonthName(month: string): string {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1);
  return new Intl.DateTimeFormat("en-CA", { month: "short" }).format(date);
}
