import json
from datetime import UTC, date, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path

import duckdb
import pandas as pd

from pipeline.clean import (
    BC_LATITUDE,
    BC_LONGITUDE,
    SYSTEM_START,
    partial_months,
    partial_years,
)
from pipeline.fetch import sha256_of

SQL_DIR = Path(__file__).parent.parent / "sql"
SUMMARY_QUERIES = [
    "monthly_counts",
    "region_counts",
    "category_counts",
    "material_mentions",
    "data_quality",
]


def connect(
    incidents: pd.DataFrame, materials: pd.DataFrame
) -> duckdb.DuckDBPyConnection:
    connection = duckdb.connect()
    connection.register("incidents", incidents)
    connection.register("incident_materials", materials)
    return connection


def run_sql_file(connection: duckdb.DuckDBPyConnection, name: str) -> list[dict]:
    query = (SQL_DIR / f"{name}.sql").read_text()
    result = connection.execute(query)
    columns = [description[0] for description in result.description]
    rows = []
    for values in result.fetchall():
        rows.append(dict(zip(columns, values)))
    return rows


def read_source_info(source: Path) -> dict:
    """Use the source.json written by `fetch` when it describes this file.
    For a file downloaded by hand, fall back to what the file itself can tell us."""
    info_path = source.parent / "source.json"
    if info_path.exists():
        info = json.loads(info_path.read_text())
        if info["file"] == source.name:
            published = parsedate_to_datetime(info["source_last_modified"])
            info["snapshot_date"] = published.date().isoformat()
            return info

    print(
        f"No source.json for {source.name}. Using the file's modified date as the snapshot date."
    )
    modified = datetime.fromtimestamp(source.stat().st_mtime, tz=UTC)
    return {
        "file": source.name,
        "size_bytes": source.stat().st_size,
        "sha256": sha256_of(source),
        "snapshot_date": modified.date().isoformat(),
    }


def write_json(path: Path, data: object, readable: bool = False) -> None:
    # The count files are loaded by the browser, so they skip whitespace.
    if readable:
        text = json.dumps(data, indent=2)
    else:
        text = json.dumps(data, separators=(",", ":"))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text + "\n")
    print(f"Wrote {path} ({path.stat().st_size:,} bytes)")


def build_meta(
    source_info: dict, stats: dict, incident_count: int, totals: dict
) -> dict:
    snapshot_date = date.fromisoformat(source_info["snapshot_date"])
    return {
        "source": source_info,
        "built_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "system_start": SYSTEM_START.isoformat(),
        "location_box": {"latitude": BC_LATITUDE, "longitude": BC_LONGITUDE},
        "first_month": f"{SYSTEM_START:%Y-%m}",
        "last_month": f"{snapshot_date:%Y-%m}",
        "partial_months": partial_months(snapshot_date),
        "partial_years": partial_years(snapshot_date),
        "rows_read": stats["rows_read"],
        "incidents": incident_count,
        "excluded_rows": [
            {"reason": "No DGIR number", "rows": stats["rows_without_dgir"]},
            {
                "reason": "Exact duplicate of another row",
                "rows": stats["exact_duplicate_rows"],
            },
            {
                "reason": "Second row for a DGIR number (the fuller row was kept)",
                "rows": stats["conflict_rows_dropped"],
            },
        ],
        "conflicting_dgirs": stats["conflicting_dgirs"],
        "totals": totals,
    }


def export(
    incidents: pd.DataFrame,
    materials: pd.DataFrame,
    stats: dict,
    source_info: dict,
    output_dir: Path,
) -> dict:
    connection = connect(incidents, materials)
    totals = {}
    for name in SUMMARY_QUERIES:
        totals[name] = run_sql_file(connection, name)

    write_json(output_dir / "counts.json", run_sql_file(connection, "report_counts"))
    write_json(
        output_dir / "material_counts.json", run_sql_file(connection, "material_counts")
    )
    meta = build_meta(source_info, stats, len(incidents), totals)
    write_json(output_dir / "meta.json", meta, readable=True)
    return meta
