from datetime import date
from pathlib import Path

import pandas as pd
import pytest

from pipeline.clean import clean
from pipeline.load import load_source

FIXTURE = Path(__file__).parent / "fixtures" / "synthetic_dgir.csv"
SNAPSHOT_DATE = date(2026, 10, 28)


@pytest.fixture
def cleaned() -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    return clean(load_source(FIXTURE), SNAPSHOT_DATE)


@pytest.fixture
def incidents(cleaned) -> pd.DataFrame:
    return cleaned[0]


@pytest.fixture
def materials(cleaned) -> pd.DataFrame:
    return cleaned[1]


@pytest.fixture
def stats(cleaned) -> dict:
    return cleaned[2]
