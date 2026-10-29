import { NOT_RECORDED } from "../lib/filters";
import { formatNumber } from "../lib/format";
import type { LabelCount } from "../types";

function BarList({ items }: { items: LabelCount[] }) {
  let largest = 0;
  for (const item of items) {
    largest = Math.max(largest, item.reports);
  }

  return (
    <ul className="bar-list">
      {items.map((item) => {
        const width = largest === 0 ? 0 : (item.reports / largest) * 100;
        const muted = item.label === NOT_RECORDED;
        return (
          <li key={item.label} className={muted ? "bar-row muted" : "bar-row"}>
            <span className="bar-label">{item.label}</span>
            <span className="bar-track" aria-hidden="true">
              <span className="bar-fill" style={{ width: `${width}%` }} />
            </span>
            <span className="bar-value">{formatNumber(item.reports)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default BarList;
