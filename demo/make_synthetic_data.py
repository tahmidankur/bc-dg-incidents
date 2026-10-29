"""Write a made-up DGIR file so the pipeline and site can run in public.

Every value here is invented. The proportions are round numbers chosen for the
demo and are not taken from the real dataset. The output has the same columns
as the real CSV, plus the kinds of problems the pipeline is built to handle.
"""

import csv
import hashlib
import json
import random
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

OUTPUT = Path("data/raw/synthetic_demo.csv")
REPORTS = 3000
FIRST_DATE = date(2020, 11, 1)
SNAPSHOT_DATE = date(2026, 6, 15)
# Fake DGIR numbers start here so they can't be mistaken for real ones.
FIRST_DGIR = 700001

COLUMNS = [
    "DGIR_Number",
    "Incident_Name",
    "Incident_Date_Time",
    "Date_Time_Logged",
    "DGIR_Last_Updated",
    "Nearest_Geographic",
    "Area",
    "MOE_Region",
    "Sector",
    "Event_Type",
    "DGIR_Coordinates",
    "DGIR_Latitude",
    "DGIR_Longitude",
    "Data_ID_Parent_Details",
    "FK_Table_257_Spills",
    "Material",
    "Material_Substance_Class",
    "Material_Quantity",
    "Material_Unit_of_Measure",
]

REGIONS = ["Lower Mainland", "Vancouver Island", "Southern Interior", "Northern"]
SECTORS = [
    "Agriculture",
    "Commercial",
    "Government",
    "Industrial",
    "Mining",
    "Recreational",
    "Residential",
    "Transportation",
]
EVENT_TYPES = [
    "Equipment Failure",
    "Human Error",
    "Intentional",
    "Natural Occurrence",
    "Sinking/Grounding",
    "Vehicle Collision",
]
# Item names from B.C.'s spill reporting categories.
SUBSTANCE_CLASSES = [
    "2-TDG Class 2.1, Flammable Gases, other than natural gas",
    "3-TDG Class 2.2 Non-flammable and Non-toxic Gases",
    "5-TDG Class 3, Flammable Liquids",
    "12-TDG Class 8, Corrosives",
    "18-Waste oil",
    "24-A substance, not covered by items 1 to 23, that can cause pollution",
    "27-No spill or release occurred/potential spill",
]


def chance(rng: random.Random, probability: float) -> bool:
    return rng.random() < probability


def pick_or_problem(rng: random.Random, values: list[str]) -> str:
    # About 2% blank and 10% "Unknown", so the data-quality table has something to show.
    if chance(rng, 0.02):
        return ""
    if chance(rng, 0.10):
        return "Unknown"
    return rng.choice(values)


def incident_datetime(rng: random.Random) -> str:
    if chance(rng, 0.15):
        return ""
    if chance(rng, 0.005):
        return "2019-06-01 12:00:00"
    days = (SNAPSHOT_DATE - FIRST_DATE).days
    moment = datetime.combine(FIRST_DATE, datetime.min.time()) + timedelta(
        days=rng.randrange(days + 1), minutes=rng.randrange(24 * 60)
    )
    return moment.strftime("%Y-%m-%d %H:%M:%S")


def coordinates(rng: random.Random) -> tuple[str, str]:
    if chance(rng, 0.03):
        return "", ""
    if chance(rng, 0.003):
        return "40.5", "-74.0"
    return f"{rng.uniform(48.5, 59.5):.5f}", f"{rng.uniform(-130.0, -115.5):.5f}"


def materials(rng: random.Random) -> tuple[str, str, str, str]:
    if chance(rng, 0.04):
        return "", "", "", ""
    count = rng.choice([1, 1, 1, 2, 3])
    classes = [rng.choice(SUBSTANCE_CLASSES) for _ in range(count)]
    names = ["Synthetic material"] * count
    quantities = [str(rng.randrange(1, 500)) for _ in range(count)]
    units = [rng.choice(["L", "kg"]) for _ in range(count)]
    return "; ".join(names), "; ".join(classes), "; ".join(quantities), "; ".join(units)


def make_row(rng: random.Random, dgir_number: int) -> dict[str, str]:
    region = "0" if chance(rng, 0.01) else pick_or_problem(rng, REGIONS)
    if region == "Unknown":
        region = rng.choice(REGIONS)
    latitude, longitude = coordinates(rng)
    material, material_class, quantity, unit = materials(rng)
    logged = datetime.combine(SNAPSHOT_DATE, datetime.min.time())
    return {
        "DGIR_Number": str(dgir_number),
        "Incident_Name": "",
        "Incident_Date_Time": incident_datetime(rng),
        "Date_Time_Logged": logged.strftime("%Y-%m-%d %H:%M:%S"),
        "DGIR_Last_Updated": logged.strftime("%Y-%m-%d %H:%M:%S"),
        "Nearest_Geographic": "",
        "Area": "",
        "MOE_Region": region,
        "Sector": pick_or_problem(rng, SECTORS),
        "Event_Type": pick_or_problem(rng, EVENT_TYPES),
        "DGIR_Coordinates": "",
        "DGIR_Latitude": latitude,
        "DGIR_Longitude": longitude,
        "Data_ID_Parent_Details": str(dgir_number),
        "FK_Table_257_Spills": str(dgir_number),
        "Material": material,
        "Material_Substance_Class": material_class,
        "Material_Quantity": quantity,
        "Material_Unit_of_Measure": unit,
    }


def make_rows(rng: random.Random) -> list[dict[str, str]]:
    rows = [make_row(rng, FIRST_DGIR + index) for index in range(REPORTS)]

    # The problems the pipeline has to count and explain.
    for row in rng.sample(rows, 5):
        rows.append(dict(row))
    for row in rng.sample(rows[:REPORTS], 3):
        shell = {column: "" for column in COLUMNS}
        shell["DGIR_Number"] = row["DGIR_Number"]
        shell["Date_Time_Logged"] = row["Date_Time_Logged"]
        shell["DGIR_Last_Updated"] = row["DGIR_Last_Updated"]
        rows.append(shell)
    for _ in range(2):
        no_id = make_row(rng, 0)
        no_id["DGIR_Number"] = ""
        rows.append(no_id)

    rng.shuffle(rows)
    return rows


def write_source_info(path: Path) -> None:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    published = datetime.combine(SNAPSHOT_DATE, datetime.min.time(), tzinfo=UTC)
    info = {
        "file": path.name,
        "size_bytes": path.stat().st_size,
        "sha256": digest,
        "downloaded_at": published.isoformat(timespec="seconds"),
        "source_url": "synthetic",
        "source_last_modified": published.strftime("%a, %d %b %Y %H:%M:%S GMT"),
        "catalogue_page": "https://catalogue.data.gov.bc.ca/dataset/dangerous-goods-incident-reports-dgir-incident-public-access-",
        "licence_title": "Synthetic demo data",
        "licence_url": "https://github.com/tahmidankur/bc-dg-incidents",
    }
    (path.parent / "source.json").write_text(json.dumps(info, indent=2) + "\n")


def main() -> None:
    rng = random.Random(2026)
    rows = make_rows(rng)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    write_source_info(OUTPUT)
    print(f"Wrote {len(rows):,} synthetic rows to {OUTPUT}")


if __name__ == "__main__":
    main()
