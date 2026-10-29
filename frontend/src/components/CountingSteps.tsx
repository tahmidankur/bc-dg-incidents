import { formatNumber } from "../lib/format";
import type { Meta } from "../types";

function CountingSteps({ meta }: { meta: Meta }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="visually-hidden">
          How rows in the source file become incident reports
        </caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col" className="number">
              Rows
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rows in the source file</td>
            <td className="number">{formatNumber(meta.rows_read)}</td>
          </tr>
          {meta.excluded_rows.map((excluded) => (
            <tr key={excluded.reason}>
              <td>Removed: {excluded.reason}</td>
              <td className="number">{formatNumber(excluded.rows)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>Incident reports counted on this site</td>
            <td className="number">{formatNumber(meta.incidents)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CountingSteps;
