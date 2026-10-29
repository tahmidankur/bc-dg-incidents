import CountingSteps from "../components/CountingSteps";
import { reportsWithLocation, totalReports } from "../lib/counts";
import { formatDate, formatNumber, formatPercent } from "../lib/format";
import type { SiteData } from "../types";

const REPOSITORY = "https://github.com/tahmidankur/bc-dg-incidents";

const REBUILD_COMMANDS = `python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python demo/make_synthetic_data.py
python -m pipeline build --source data/raw/synthetic_demo.csv
cd frontend && npm install && npm run build`;

function AboutData({ data }: { data: SiteData }) {
  const { counts, meta } = data;
  const datedReports = totalReports(counts.filter((row) => row.month !== null));
  const box = meta.location_box;

  return (
    <article className="prose">
      <h1>About the data</h1>

      <h2>Why the data is synthetic</h2>
      <p>
        I built this project on the{" "}
        <a href={meta.source.catalogue_page}>
          Dangerous Goods Incident Reports (DGIR) Incident (PUBLIC Access)
        </a>{" "}
        dataset from the B.C. Data Catalogue. Its licence is Access Only, which
        doesn&rsquo;t allow republishing it without written permission. So the
        version with real data stays private, and this public copy runs the same
        code on made-up reports.
      </p>
      <p>
        <code>demo/make_synthetic_data.py</code> writes{" "}
        {formatNumber(meta.rows_read)} rows with the same columns as the real
        file. The proportions are round numbers I chose, not taken from the real
        data. It also adds the problems the pipeline is built for: missing and
        impossible dates, blank and Unknown categories, bad coordinates,
        duplicate rows, repeated DGIR numbers and rows with no DGIR number.
      </p>
      <dl className="facts">
        <dt>Demo snapshot date</dt>
        <dd>{formatDate(meta.source.snapshot_date)}</dd>
        <dt>File</dt>
        <dd>{meta.source.file}</dd>
        <dt>SHA-256</dt>
        <dd>
          <code>{meta.source.sha256}</code>
        </dd>
      </dl>

      <h2>How reports are counted</h2>
      <p>
        Each report has a DGIR number, and every count on this site is a count
        of distinct DGIR numbers. When a report lists several materials, they
        share one row, separated by semicolons.
      </p>
      <CountingSteps meta={meta} />
      <p>
        When a DGIR number appears on more than one row, the row with the most
        filled-in fields is kept, and if that&rsquo;s a tie, the one updated
        most recently. {formatNumber(meta.conflicting_dgirs)} DGIR numbers had a
        second row in this file.
      </p>
      <p>
        Substance classes are counted once per report. A report that lists two
        classes counts once in each, so the substance class bars add up to more
        than the number of reports.
      </p>

      <h2>What was cleaned</h2>
      <ul>
        <li>
          A date counts if it falls between {formatDate(meta.system_start)} and
          the snapshot date. {formatNumber(meta.incidents - datedReports)}{" "}
          reports have no usable date. They stay in every total but can&rsquo;t
          go in the monthly chart or in a year.
        </li>
        <li>
          A region recorded as &ldquo;0&rdquo; is treated as Not recorded.
        </li>
        <li>
          &ldquo;Unknown&rdquo; is kept as its own sector and event type,
          separate from a blank field.
        </li>
        <li>
          A location is usable when the latitude and longitude are both numbers
          inside a loose box around B.C. (latitude {box.latitude[0]} to{" "}
          {box.latitude[1]}, longitude {box.longitude[0]} to {box.longitude[1]}
          ). {formatPercent(reportsWithLocation(counts), meta.incidents)} of
          reports have one.
        </li>
        <li>
          Quantities aren&rsquo;t used, because litres and kilograms can&rsquo;t
          be added together.
        </li>
      </ul>

      <h2>How to rebuild it</h2>
      <p>
        The code is on <a href={REPOSITORY}>GitHub</a>. From a fresh copy:
      </p>
      {/* Focusable so keyboard users can scroll it on narrow screens. */}
      <pre className="commands" tabIndex={0} aria-label="Rebuild commands">
        <code>{REBUILD_COMMANDS}</code>
      </pre>
    </article>
  );
}

export default AboutData;
