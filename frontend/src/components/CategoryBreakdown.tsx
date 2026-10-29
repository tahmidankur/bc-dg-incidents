import { useState } from "react";
import { countBy, countMaterialClasses, topWithOther } from "../lib/counts";
import { formatNumber, formatPercent } from "../lib/format";
import type { CountRow, LabelCount, MaterialCountRow } from "../types";
import BarList from "./BarList";

const VIEWS = [
  { key: "event_type", button: "Event type", heading: "Reports by event type" },
  { key: "sector", button: "Sector", heading: "Reports by sector" },
  {
    key: "material_class",
    button: "Substance class",
    heading: "Reports by substance class",
  },
] as const;

type View = (typeof VIEWS)[number]["key"];

function describe(view: View, items: LabelCount[], total: number): string {
  const largest = items[0];
  if (view === "material_class") {
    return `A report can mention more than one substance class, so these bars add up to more than the ${formatNumber(total)} matching reports. ${largest.label} is mentioned most often.`;
  }
  const unknown = items.find((item) => item.label === "Unknown");
  // Skip the Unknown sentence when Unknown is already the largest group named above.
  const unknownText =
    unknown && unknown !== largest
      ? ` The reporter chose Unknown on ${formatPercent(unknown.reports, total)} of them.`
      : "";
  const noun = view === "sector" ? "sector" : "event type";
  return `${largest.label} is the largest ${noun} group, at ${formatPercent(largest.reports, total)} of matching reports.${unknownText}`;
}

type CategoryBreakdownProps = {
  rows: CountRow[];
  materialRows: MaterialCountRow[];
  total: number;
};

function CategoryBreakdown({
  rows,
  materialRows,
  total,
}: CategoryBreakdownProps) {
  const [view, setView] = useState<View>("event_type");
  const current = VIEWS.find((option) => option.key === view)!;

  const allItems =
    view === "material_class"
      ? countMaterialClasses(materialRows)
      : countBy(rows, view);
  const items = topWithOther(allItems, 10);

  return (
    <section aria-labelledby="category-heading">
      <h2 id="category-heading">{current.heading}</h2>
      <div className="toggle" role="group" aria-label="Group reports by">
        {VIEWS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={view === option.key}
            onClick={() => setView(option.key)}
          >
            {option.button}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p>No matching report has a substance class recorded.</p>
      ) : (
        <>
          <BarList items={items} />
          <p className="chart-note">{describe(view, allItems, total)}</p>
        </>
      )}
    </section>
  );
}

export default CategoryBreakdown;
