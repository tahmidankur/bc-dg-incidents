from datetime import date, datetime, timedelta

import pandas as pd

# WebEOC, the system behind this dataset, went into use in November 2020.
SYSTEM_START = date(2020, 11, 1)
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Loose box around B.C. plus a margin for coastal waters and border areas.
BC_LATITUDE = (47.0, 61.0)
BC_LONGITUDE = (-140.0, -113.0)

# Values the source uses in place of a blank.
NOT_RECORDED_VALUES = {"region": {"0"}}

CLASS_SPELLING = {"12- TDG Class 8, Corrosives": "12-TDG Class 8, Corrosives"}


def drop_rows_without_id(rows: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    has_id = rows["dgir_number"].notna()
    return rows[has_id], int((~has_id).sum())


def drop_exact_duplicates(rows: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    duplicated = rows.duplicated()
    return rows[~duplicated], int(duplicated.sum())


def resolve_repeated_ids(rows: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Keep one row per DGIR: the one with the most filled fields, then the
    most recently updated. Returns the kept rows and how many DGIRs had a conflict."""
    ranked = rows.assign(
        filled_fields=rows.notna().sum(axis=1),
        source_row_count=rows.groupby("dgir_number")["dgir_number"].transform("size"),
    )
    ranked = ranked.sort_values(
        ["dgir_number", "filled_fields", "last_updated_at"],
        ascending=[True, False, False],
        na_position="last",
    )
    kept = ranked.drop_duplicates("dgir_number", keep="first")
    conflicts = int((kept["source_row_count"] > 1).sum())
    return kept.drop(columns="filled_fields"), conflicts


def classify_date(value: str | None, snapshot_date: date) -> tuple[date | None, str]:
    if pd.isna(value):
        return None, "missing"
    try:
        parsed = datetime.strptime(value, DATE_FORMAT).date()
    except ValueError:
        return None, "unparseable"
    if parsed < SYSTEM_START or parsed > snapshot_date:
        return None, "out_of_range"
    # Many source times are exactly 12:00:00, a placeholder, so only the date is kept.
    return parsed, "usable"


def classify_location(latitude: str | None, longitude: str | None) -> str:
    if pd.isna(latitude) or pd.isna(longitude):
        return "missing"
    try:
        lat = float(latitude)
        lon = float(longitude)
    except ValueError:
        return "invalid"
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return "invalid"
    in_bc = (
        BC_LATITUDE[0] <= lat <= BC_LATITUDE[1]
        and BC_LONGITUDE[0] <= lon <= BC_LONGITUDE[1]
    )
    if in_bc:
        return "usable"
    return "outside_bc"


def build_incidents(rows: pd.DataFrame, snapshot_date: date) -> pd.DataFrame:
    dates = []
    date_statuses = []
    for value in rows["incident_datetime"]:
        incident_date, status = classify_date(value, snapshot_date)
        dates.append(incident_date)
        date_statuses.append(status)

    location_statuses = []
    for latitude, longitude in zip(rows["latitude"], rows["longitude"]):
        location_statuses.append(classify_location(latitude, longitude))

    incidents = pd.DataFrame(
        {
            "dgir_number": rows["dgir_number"].to_list(),
            "incident_date": pd.to_datetime(dates),
            "date_status": date_statuses,
            "region": rows["region"].to_list(),
            "sector": rows["sector"].to_list(),
            "event_type": rows["event_type"].to_list(),
            "location_status": location_statuses,
            "source_row_count": rows["source_row_count"].to_list(),
        }
    )
    for column, values in NOT_RECORDED_VALUES.items():
        incidents.loc[incidents[column].isin(values), column] = None
    return incidents.sort_values("dgir_number", ignore_index=True)


def build_incident_materials(rows: pd.DataFrame) -> pd.DataFrame:
    links = []
    for dgir_number, class_list in zip(rows["dgir_number"], rows["material_class"]):
        if pd.isna(class_list):
            continue
        seen = set()
        for part in class_list.split(";"):
            material_class = CLASS_SPELLING.get(part.strip(), part.strip())
            # A report that lists the same class twice still mentions it once.
            if material_class and material_class not in seen:
                seen.add(material_class)
                links.append(
                    {"dgir_number": dgir_number, "material_class": material_class}
                )
    return pd.DataFrame(links, columns=["dgir_number", "material_class"])


def clean(
    rows: pd.DataFrame, snapshot_date: date
) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    rows_read = len(rows)
    rows, without_id = drop_rows_without_id(rows)
    rows, exact_duplicates = drop_exact_duplicates(rows)
    rows, conflicts = resolve_repeated_ids(rows)
    incidents = build_incidents(rows, snapshot_date)
    materials = build_incident_materials(rows)
    stats = {
        "rows_read": rows_read,
        "rows_without_dgir": without_id,
        "exact_duplicate_rows": exact_duplicates,
        "conflicting_dgirs": conflicts,
        "conflict_rows_dropped": rows_read
        - without_id
        - exact_duplicates
        - len(incidents),
    }
    return incidents, materials, stats


def is_last_day_of_month(day: date) -> bool:
    return (day + timedelta(days=1)).month != day.month


def partial_months(snapshot_date: date) -> list[str]:
    # The first month is partial because WebEOC started part way through it.
    months = [f"{SYSTEM_START:%Y-%m}"]
    if not is_last_day_of_month(snapshot_date):
        months.append(f"{snapshot_date:%Y-%m}")
    return months


def partial_years(snapshot_date: date) -> list[int]:
    years = [SYSTEM_START.year]
    if (snapshot_date.month, snapshot_date.day) != (12, 31):
        years.append(snapshot_date.year)
    return years
