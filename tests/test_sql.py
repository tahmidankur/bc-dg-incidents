import pytest

from pipeline.export import connect, run_sql_file


@pytest.fixture
def connection(incidents, materials):
    return connect(incidents, materials)


def total(rows: list[dict]) -> int:
    return sum(row["reports"] for row in rows)


def test_sql_totals_equal_rows_in_incidents(connection, incidents):
    assert total(run_sql_file(connection, "region_counts")) == len(incidents)
    assert total(run_sql_file(connection, "report_counts")) == len(incidents)


def test_monthly_counts_leave_out_reports_without_a_usable_date(connection, incidents):
    usable = (incidents["date_status"] == "usable").sum()
    assert total(run_sql_file(connection, "monthly_counts")) == usable
    assert usable == len(incidents) - 3


def test_report_counts_have_no_month_for_bad_dates(connection):
    undated = [
        row for row in run_sql_file(connection, "report_counts") if row["month"] is None
    ]
    assert total(undated) == 3


def test_not_recorded_region_is_its_own_row(connection):
    regions = {
        row["region"]: row["reports"]
        for row in run_sql_file(connection, "region_counts")
    }
    assert regions[None] == 1


def test_material_mentions_count_each_report_once_per_class(connection):
    mentions = {
        row["material_class"]: row["reports"]
        for row in run_sql_file(connection, "material_mentions")
    }
    # 900001, 900002 (listed twice), 900003 (duplicate row) and 900008
    assert mentions["5-TDG Class 3, Flammable Liquids"] == 4


def test_data_quality_uses_all_reports_as_denominator(connection, incidents):
    quality = run_sql_file(connection, "data_quality")
    location_outside = next(
        row for row in quality if row["issue"] == "Outside the B.C. area"
    )
    assert location_outside["reports"] == 1
    assert location_outside["percent"] == round(100 / len(incidents), 1)


def test_category_counts_cover_every_report(connection, incidents):
    categories = run_sql_file(connection, "category_counts")
    for category in ("event_type", "sector"):
        rows = [row for row in categories if row["category"] == category]
        assert total(rows) == len(incidents)
