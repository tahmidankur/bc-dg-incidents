from pathlib import Path

import pandas as pd

# Source column -> the name used everywhere after loading. Columns left out
# (incident name, nearest place, free-text coordinates, material names,
# quantities, internal WebEOC IDs) are not used and never published.
SOURCE_COLUMNS = {
    "DGIR_Number": "dgir_number",
    "Incident_Date_Time": "incident_datetime",
    "DGIR_Last_Updated": "last_updated_at",
    "MOE_Region": "region",
    "Sector": "sector",
    "Event_Type": "event_type",
    "DGIR_Latitude": "latitude",
    "DGIR_Longitude": "longitude",
    "Material_Substance_Class": "material_class",
}


def read_raw(source: Path) -> pd.DataFrame:
    if not source.exists():
        raise FileNotFoundError(
            f"No file at {source}. Run `python -m pipeline fetch` or save the CSV "
            "from the B.C. Data Catalogue into data/raw/."
        )
    # Everything is read as text so nothing is converted before we have looked
    # at it. Empty and whitespace-only cells become missing.
    table = pd.read_csv(source, dtype=str, keep_default_na=False)
    for column in table.columns:
        table[column] = table[column].str.strip().replace("", None)
    return table


def load_source(source: Path) -> pd.DataFrame:
    table = read_raw(source)
    missing = [column for column in SOURCE_COLUMNS if column not in table.columns]
    if missing:
        raise ValueError(
            f"{source} is missing the columns {missing}. The publisher may have "
            "renamed them. Run `python -m pipeline inspect` to see the real "
            "headers and update SOURCE_COLUMNS in pipeline/load.py."
        )
    return table[list(SOURCE_COLUMNS)].rename(columns=SOURCE_COLUMNS)
