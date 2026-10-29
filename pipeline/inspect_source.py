from pathlib import Path

import pandas as pd

from pipeline.clean import BC_LATITUDE, BC_LONGITUDE, DATE_FORMAT
from pipeline.load import read_raw

ID_COLUMN = "DGIR_Number"
# A column with this many distinct values or fewer is printed as a category list.
CATEGORY_LIMIT = 60


def print_columns(table: pd.DataFrame, guessed_types: pd.Series) -> None:
    print(f"\nColumns ({len(table.columns)})")
    for column in table.columns:
        missing = table[column].isna().mean() * 100
        examples = table[column].dropna().drop_duplicates().head(3).tolist()
        print(
            f"  {column}: pandas guesses {guessed_types[column]}, {missing:.1f}% missing"
        )
        print(f"      e.g. {examples}")


def print_categories(table: pd.DataFrame) -> None:
    for column in table.columns:
        counts = table[column].value_counts(dropna=False)
        if len(counts) > CATEGORY_LIMIT:
            continue
        print(f"\n{column} ({len(counts)} distinct values, counted by row)")
        for value, count in counts.items():
            label = "<missing>" if pd.isna(value) else value
            print(f"  {count:>7,}  {label}")


def print_dates(table: pd.DataFrame) -> None:
    for column in table.columns:
        if "Date" not in column:
            continue
        values = table[column].dropna()
        parsed = pd.to_datetime(values, format=DATE_FORMAT, errors="coerce")
        print(f"\n{column}")
        print(f"  missing: {table[column].isna().sum():,}")
        print(f"  not in {DATE_FORMAT}: {parsed.isna().sum():,}")
        if parsed.isna().any():
            print(f"      e.g. {values[parsed.isna()].head(5).tolist()}")
        print(f"  earliest: {parsed.min()}  latest: {parsed.max()}")


def print_coordinates(table: pd.DataFrame) -> None:
    ranges = {"DGIR_Latitude": BC_LATITUDE, "DGIR_Longitude": BC_LONGITUDE}
    for column, (low, high) in ranges.items():
        values = table[column]
        numbers = pd.to_numeric(values, errors="coerce")
        non_numeric = values.notna() & numbers.isna()
        outside = numbers.notna() & ~numbers.between(low, high)
        print(f"\n{column}")
        print(f"  missing: {values.isna().sum():,}  non-numeric: {non_numeric.sum():,}")
        print(f"  min: {numbers.min()}  max: {numbers.max()}")
        print(f"  outside {low} to {high}: {outside.sum():,}")
        if outside.any():
            print(f"      e.g. {values[outside].head(5).tolist()}")


def print_rows_per_id(table: pd.DataFrame) -> None:
    has_id = table[ID_COLUMN].notna()
    print(f"\nRows per {ID_COLUMN}")
    print(f"  rows with no {ID_COLUMN}: {(~has_id).sum():,}")
    print(f"  exact duplicate rows: {table.duplicated().sum():,}")

    rows_per_id = table[has_id].groupby(ID_COLUMN).size()
    print(f"  distinct {ID_COLUMN}: {len(rows_per_id):,}")
    print(f"  with 1 row: {(rows_per_id == 1).sum():,}")
    print(f"  with 2 rows: {(rows_per_id == 2).sum():,}")
    print(f"  with 3+ rows: {(rows_per_id >= 3).sum():,}  (most: {rows_per_id.max()})")

    repeated_ids = rows_per_id[rows_per_id > 1].index
    repeated = table[table[ID_COLUMN].isin(repeated_ids)]
    print(f"\nColumns that differ between rows sharing a {ID_COLUMN}")
    print(
        f"  (number of the {len(repeated_ids):,} repeated IDs where the column has 2+ values)"
    )
    distinct_per_id = repeated.groupby(ID_COLUMN).nunique(dropna=False)
    for column in distinct_per_id.columns:
        differing = (distinct_per_id[column] > 1).sum()
        print(f"  {differing:>7,}  {column}")


def inspect_source(source: Path) -> None:
    table = read_raw(source)
    guessed_types = pd.read_csv(source).dtypes
    print(f"Source: {source}")
    print(f"Rows: {len(table):,}")
    print_columns(table, guessed_types)
    print_categories(table)
    print_dates(table)
    print_coordinates(table)
    print_rows_per_id(table)
