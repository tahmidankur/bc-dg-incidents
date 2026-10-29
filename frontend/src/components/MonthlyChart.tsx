import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthlyCounts, monthsToShow } from "../lib/counts";
import {
  formatDate,
  formatMonth,
  formatMonthName,
  formatNumber,
} from "../lib/format";
import type { CountRow, Meta } from "../types";

const FULL_MONTH_COLOUR = "#2f6b57";
const PARTIAL_MONTH_COLOUR = "#a9c7bb";
const GRIDLINE_COLOUR = "#e4e7e5";
const HOVER_COLOUR = "#f1f3f2";

type MonthlyChartProps = {
  rows: CountRow[];
  meta: Meta;
  year: string;
  undatedReports: number;
};

function partialMonthsNote(partialMonths: string[], meta: Meta): string {
  if (partialMonths.length === 0) {
    return "";
  }
  const reasons = [];
  for (const month of partialMonths) {
    const name = formatMonth(month, "long");
    if (month === meta.first_month) {
      reasons.push(`${name} (the reporting system started that month)`);
    } else {
      const snapshot = formatDate(meta.source.snapshot_date);
      reasons.push(`${name} (the snapshot ends ${snapshot})`);
    }
  }
  return `Lighter bars are partial months: ${reasons.join(" and ")}.`;
}

function undatedNote(undatedReports: number, year: string): string {
  const count = formatNumber(undatedReports);
  if (year) {
    return `${count} reports that match the other filters have no usable incident date, so they can't be placed in ${year} and aren't counted here.`;
  }
  return `${count} of these reports have no usable incident date and aren't in this chart.`;
}

function MonthlyChart({ rows, meta, year, undatedReports }: MonthlyChartProps) {
  const months = monthsToShow(meta, year);
  const data = monthlyCounts(rows, months);
  const partialMonths = meta.partial_months.filter((month) =>
    months.includes(month),
  );

  let busiest = data[0];
  for (const point of data) {
    if (point.reports > busiest.reports) {
      busiest = point;
    }
  }

  // With every month on screen, label only each January so the axis stays readable.
  const ticks = year
    ? months
    : months.filter((month, index) => index === 0 || month.endsWith("-01"));

  return (
    <section aria-labelledby="monthly-heading">
      <h2 id="monthly-heading">Reports per month</h2>
      <div className="chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
            title="Bar chart of reports per month"
            desc="Use the arrow keys to move between months. The text below the chart describes it."
          >
            <CartesianGrid vertical={false} stroke={GRIDLINE_COLOUR} />
            <XAxis
              dataKey="label"
              ticks={ticks}
              tickFormatter={(month: string) =>
                year ? formatMonthName(month) : month.slice(0, 4)
              }
              label={{
                value: "Month of incident",
                position: "insideBottom",
                offset: -16,
              }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              width={56}
              label={{ value: "Reports", angle: -90, position: "insideLeft" }}
              tickFormatter={(value: number) => formatNumber(value)}
            />
            <Tooltip
              cursor={{ fill: HOVER_COLOUR }}
              labelFormatter={(month) => formatMonth(String(month), "long")}
              formatter={(value) => [formatNumber(Number(value)), "Reports"]}
            />
            <Bar dataKey="reports" isAnimationActive={false}>
              {data.map((point) => (
                <Cell
                  key={point.label}
                  fill={
                    partialMonths.includes(point.label)
                      ? PARTIAL_MONTH_COLOUR
                      : FULL_MONTH_COLOUR
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">
        The highest month shown is {formatMonth(busiest.label, "long")}, with{" "}
        {formatNumber(busiest.reports)} reports.{" "}
        {partialMonthsNote(partialMonths, meta)}
      </p>
      {undatedReports > 0 && (
        <p className="chart-note">{undatedNote(undatedReports, year)}</p>
      )}
    </section>
  );
}

export default MonthlyChart;
