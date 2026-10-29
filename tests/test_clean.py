from datetime import date

import pandas as pd
import pytest

from pipeline.clean import partial_months, partial_years
from pipeline.load import load_source


def incident(incidents: pd.DataFrame, dgir_number: str) -> pd.Series:
    matches = incidents[incidents["dgir_number"] == dgir_number]
    assert len(matches) == 1
    return matches.iloc[0]


def classes_for(materials: pd.DataFrame, dgir_number: str) -> list[str]:
    return materials.loc[
        materials["dgir_number"] == dgir_number, "material_class"
    ].to_list()


def test_one_row_with_two_classes_gives_one_incident_and_two_links(
    incidents, materials
):
    incident(incidents, "900001")
    assert classes_for(materials, "900001") == [
        "5-TDG Class 3, Flammable Liquids",
        "18-Waste oil",
    ]


def test_same_class_twice_in_one_report_is_one_link(materials):
    assert classes_for(materials, "900002") == ["5-TDG Class 3, Flammable Liquids"]


def test_exact_duplicate_row_adds_no_incident_or_link(incidents, materials, stats):
    incident(incidents, "900003")
    assert len(classes_for(materials, "900003")) == 1
    assert stats["exact_duplicate_rows"] == 1


def test_row_without_dgir_is_excluded_and_counted(incidents, stats):
    assert incidents["dgir_number"].notna().all()
    assert stats["rows_without_dgir"] == 1


def test_repeated_dgir_keeps_fuller_row_and_counts_conflict(incidents, stats):
    kept = incident(incidents, "900010")
    assert kept["region"] == "Vancouver Island"
    assert kept["source_row_count"] == 2
    assert stats["conflicting_dgirs"] == 1
    assert stats["conflict_rows_dropped"] == 1


def test_every_row_is_accounted_for(incidents, stats):
    excluded = (
        stats["rows_without_dgir"]
        + stats["exact_duplicate_rows"]
        + stats["conflict_rows_dropped"]
    )
    assert stats["rows_read"] == len(incidents) + excluded
    assert len(incidents) == 11


@pytest.mark.parametrize(
    ("dgir_number", "expected_status"),
    [("900005", "unparseable"), ("900006", "missing"), ("900007", "out_of_range")],
)
def test_bad_dates_stay_in_incidents_without_a_date(
    incidents, dgir_number, expected_status
):
    row = incident(incidents, dgir_number)
    assert row["date_status"] == expected_status
    assert pd.isna(row["incident_date"])


def test_coordinate_outside_bc_is_flagged_and_still_counted(incidents):
    assert incident(incidents, "900008")["location_status"] == "outside_bc"


def test_non_numeric_coordinate_is_invalid(incidents):
    assert incident(incidents, "900012")["location_status"] == "invalid"


def test_region_zero_becomes_not_recorded(incidents):
    assert pd.isna(incident(incidents, "900009")["region"])


def test_unknown_is_kept_separate_from_blank(incidents):
    assert incident(incidents, "900009")["event_type"] == "Unknown"


def test_class_spelling_variant_is_fixed(materials):
    assert classes_for(materials, "900011") == ["12-TDG Class 8, Corrosives"]


def test_quantities_and_units_are_not_kept(incidents, materials):
    # Quantities in different units must never be added, so they never leave load.py.
    for table in (incidents, materials):
        for column in table.columns:
            assert "quantity" not in column
            assert "unit" not in column


def test_first_month_and_unfinished_last_month_are_partial():
    assert partial_months(date(2026, 10, 28)) == ["2020-11", "2026-10"]
    assert partial_years(date(2026, 10, 28)) == [2020, 2026]


def test_snapshot_on_last_day_is_not_partial():
    assert partial_months(date(2026, 10, 31)) == ["2020-11"]
    assert partial_years(date(2026, 12, 31)) == [2020]


def test_missing_column_gives_a_clear_error(tmp_path):
    source = tmp_path / "synthetic_missing_column.csv"
    source.write_text("DGIR_Number,MOE_Region\n900001,Northern\n")
    with pytest.raises(ValueError, match="missing the columns"):
        load_source(source)
