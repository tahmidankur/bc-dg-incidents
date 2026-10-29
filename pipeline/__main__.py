import argparse
from datetime import date
from pathlib import Path

from pipeline.clean import clean
from pipeline.export import export, read_source_info
from pipeline.fetch import fetch
from pipeline.inspect_source import inspect_source
from pipeline.load import load_source

RAW_DIR = Path("data/raw")
OUTPUT_DIR = Path("frontend/public/data")


def build(source: Path) -> None:
    rows = load_source(source)
    print(f"Read {len(rows):,} rows from {source}")
    source_info = read_source_info(source)
    snapshot_date = date.fromisoformat(source_info["snapshot_date"])
    incidents, materials, stats = clean(rows, snapshot_date)
    meta = export(incidents, materials, stats, source_info, OUTPUT_DIR)

    usable = (incidents["location_status"] == "usable").sum()
    print()
    print(f"Snapshot date:      {snapshot_date}")
    print(f"Rows read:          {stats['rows_read']:,}")
    print(f"Incident reports:   {meta['incidents']:,}")
    for excluded in meta["excluded_rows"]:
        print(f"Excluded:           {excluded['rows']:,} ({excluded['reason']})")
    print(f"Conflicting DGIRs:  {stats['conflicting_dgirs']:,}")
    print(f"Material links:     {len(materials):,}")
    print(f"Usable location:    {usable / len(incidents):.1%}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m pipeline")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("fetch", help="download the DGIR CSV into data/raw/")
    inspect_parser = commands.add_parser("inspect", help="profile a raw DGIR file")
    inspect_parser.add_argument("--source", type=Path, required=True)
    build_parser = commands.add_parser(
        "build", help="clean the file and write the site's JSON"
    )
    build_parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()

    if args.command == "fetch":
        fetch(RAW_DIR)
    elif args.command == "inspect":
        inspect_source(args.source)
    elif args.command == "build":
        build(args.source)


if __name__ == "__main__":
    main()
