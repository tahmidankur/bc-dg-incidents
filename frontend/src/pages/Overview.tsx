import BarList from "../components/BarList";
import CategoryBreakdown from "../components/CategoryBreakdown";
import Filters from "../components/Filters";
import MissingDataTable from "../components/MissingDataTable";
import MonthlyChart from "../components/MonthlyChart";
import {
  countBy,
  reportsWithLocation,
  reportsWithoutDate,
  totalReports,
} from "../lib/counts";
import {
  DEFAULT_FILTERS,
  NOT_RECORDED,
  filterCounts,
  filterMaterialCounts,
} from "../lib/filters";
import { formatMonth, formatNumber, formatPercent } from "../lib/format";
import type { CountRow, Filters as FilterValues, SiteData } from "../types";

function summarySentence(rows: CountRow[], filters: FilterValues): string {
  const total = totalReports(rows);
  const parts = [
    `${formatNumber(total)} reports match.`,
    `${formatPercent(reportsWithLocation(rows), total)} have a usable location.`,
  ];
  const regions = countBy(rows, "region").filter(
    (item) => item.label !== NOT_RECORDED,
  );
  if (!filters.region && regions.length > 0) {
    parts.push(
      `${regions[0].label} has the most (${formatNumber(regions[0].reports)}).`,
    );
  }
  parts.push("Counts aren't adjusted for population or activity.");
  return parts.join(" ");
}

function regionSentence(rows: CountRow[]): string {
  const regions = countBy(rows, "region");
  const notRecorded = regions.find((item) => item.label === NOT_RECORDED);
  const named = regions.length - (notRecorded ? 1 : 0);
  const regionWord = named === 1 ? "region" : "regions";
  const missingText = notRecorded
    ? ` ${formatNumber(notRecorded.reports)} have no region recorded and are shown last.`
    : "";
  return `The matching reports come from ${named} Ministry of Environment ${regionWord}.${missingText}`;
}

type OverviewProps = {
  data: SiteData;
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
};

function Overview({ data, filters, onFiltersChange }: OverviewProps) {
  const { counts, materialCounts, meta } = data;
  const matching = filterCounts(counts, filters);
  const total = totalReports(matching);
  const undated = reportsWithoutDate(
    filterCounts(counts, { ...filters, year: "" }),
  );

  return (
    <>
      <section className="intro">
        <h1>
          Synthetic dangerous goods incident reports,{" "}
          {formatMonth(meta.first_month, "long")} to{" "}
          {formatMonth(meta.last_month, "long")}
        </h1>
        <p>
          This site runs my pipeline on made-up reports with the same columns as
          the Province of B.C.&rsquo;s Dangerous Goods Incident Reports dataset.
          That dataset&rsquo;s licence doesn&rsquo;t allow republishing it, so I
          publish the project with synthetic data instead.
        </p>
        <p className="disclaimer">
          None of these numbers describe real incidents. Student project, not an
          official Government of B.C. site.
        </p>
      </section>

      <Filters
        meta={meta}
        counts={counts}
        filters={filters}
        onChange={onFiltersChange}
      />

      {total === 0 ? (
        <div className="notice">
          <p>No reports match these filters.</p>
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <p className="summary" aria-live="polite">
            {summarySentence(matching, filters)}
          </p>
          <MonthlyChart
            rows={matching}
            meta={meta}
            year={filters.year}
            undatedReports={undated}
          />
          <section aria-labelledby="region-heading">
            <h2 id="region-heading">Reports by region</h2>
            <BarList items={countBy(matching, "region")} />
            <p className="chart-note">{regionSentence(matching)}</p>
          </section>
          <CategoryBreakdown
            rows={matching}
            materialRows={filterMaterialCounts(materialCounts, filters)}
            total={total}
          />
        </>
      )}

      <MissingDataTable meta={meta} />
    </>
  );
}

export default Overview;
