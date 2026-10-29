import { formatNumber, formatPercent } from "../lib/format";
import type { Meta } from "../types";

function MissingDataTable({ meta }: { meta: Meta }) {
  return (
    <section aria-labelledby="missing-heading">
      <h2 id="missing-heading">Missing and unusable fields</h2>
      <p>
        These numbers cover all {formatNumber(meta.incidents)} reports in the
        snapshot and don't change with the filters.
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Problem</th>
              <th scope="col" className="number">
                Reports
              </th>
              <th scope="col" className="number">
                Share of all reports
              </th>
            </tr>
          </thead>
          <tbody>
            {meta.totals.data_quality.map((row) => (
              <tr key={`${row.field} ${row.issue}`}>
                <td>{row.field}</td>
                <td>{row.issue}</td>
                <td className="number">{formatNumber(row.reports)}</td>
                <td className="number">
                  {formatPercent(row.reports, meta.incidents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-note">
        A report without a usable location still counts in every total and chart
        above. It only lowers the share of reports with a usable location.
        &ldquo;Unknown&rdquo; means the reporter chose that value, while
        &ldquo;Not recorded&rdquo; means the field was left blank.
      </p>
    </section>
  );
}

export default MissingDataTable;
