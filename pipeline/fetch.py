import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path

import requests

CATALOGUE_PAGE = "https://catalogue.data.gov.bc.ca/dataset/dangerous-goods-incident-reports-dgir-incident-public-access-"
PACKAGE_API = "https://catalogue.data.gov.bc.ca/api/3/action/package_show?id=47ab5a8b-d01d-4b34-bd94-34526cc0db01"
CSV_RESOURCE_NAME = "DGIR Incident (PUBLIC) - CSV"


def find_csv_resource() -> dict:
    # The download URL is looked up each time rather than hardcoded, because
    # the catalogue can move a resource to a new storage object.
    response = requests.get(PACKAGE_API, timeout=30)
    response.raise_for_status()
    package = response.json()["result"]
    for resource in package["resources"]:
        if resource["name"] == CSV_RESOURCE_NAME:
            return {
                "url": resource["url"],
                "licence_title": package["license_title"],
                "licence_url": package["license_url"],
            }
    names = [resource["name"] for resource in package["resources"]]
    raise ValueError(
        f"Expected a resource named '{CSV_RESOURCE_NAME}' in the catalogue record, "
        f"found {names}. Download the CSV from {CATALOGUE_PAGE} into data/raw/ instead."
    )


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fetch(raw_dir: Path) -> Path:
    resource = find_csv_resource()
    downloaded_at = datetime.now(UTC)
    target = raw_dir / f"dgir_incident_{downloaded_at:%Y-%m-%d}.csv"

    print(f"Downloading {resource['url']}")
    response = requests.get(resource["url"], timeout=120)
    response.raise_for_status()
    raw_dir.mkdir(parents=True, exist_ok=True)
    target.write_bytes(response.content)

    source = {
        "file": target.name,
        "size_bytes": target.stat().st_size,
        "sha256": sha256_of(target),
        "downloaded_at": downloaded_at.isoformat(timespec="seconds"),
        "source_url": resource["url"],
        "source_last_modified": response.headers.get("last-modified"),
        "catalogue_page": CATALOGUE_PAGE,
        "licence_title": resource["licence_title"],
        "licence_url": resource["licence_url"],
    }
    (raw_dir / "source.json").write_text(json.dumps(source, indent=2) + "\n")
    print(f"Saved {target} ({source['size_bytes']:,} bytes)")
    return target
