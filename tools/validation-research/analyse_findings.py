"""Measure, across the downloaded cores, the things a finding count alone cannot tell us.

Three questions the report needs answered with numbers rather than impressions:

  * what date syntaxes actually occur, so a warning about "unrecognised" dates can be split into
    true positives (corrupted values) and false positives (valid but unhandled syntaxes);
  * whether coordinate errors exist at all in already-published data;
  * whether an empty locality or date really means the information is absent, or only that it
    lives in another column (verbatimLocality, country, verbatimEventDate, year).

Reads the extracted cores from the work directory; writes out/aggregate-notes.md.

Usage: python3 analyse_findings.py --work /home/ubuntu/dsval
"""

from __future__ import annotations

import argparse
import collections
import csv
import glob
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"

ISO_DATE = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
ISO_DATE_UNPADDED = re.compile(r"^\d{4}-\d{1,2}(-\d{1,2})?$")
ISO_INTERVAL = re.compile(r"^\d{4}(-\d{1,2}(-\d{1,2})?)?/\d{4}(-\d{1,2}(-\d{1,2})?)?$")
SLASH_OR_DASH = re.compile(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$")
EXCEL_SERIAL = re.compile(r"^\d{4,5}$")
MONTH_ABBREVIATION = re.compile(r"^[A-Za-z]{3}-\d{2,4}$")
PARTIAL_ISO = re.compile(r"^-{1,2}\d{1,2}(-\d{1,2})?$")
NUMBER = re.compile(r"^-?\d+(\.\d+)?$")

GEOGRAPHY_FALLBACKS = ("verbatimLocality", "higherGeography", "county", "stateProvince", "country", "island", "waterBody", "locationRemarks")


def classify_date(value: str) -> str:
    if not value:
        return "empty"
    if ISO_DATE.match(value):
        return "iso"
    if ISO_INTERVAL.match(value):
        return "iso_interval"
    if ISO_DATE_UNPADDED.match(value):
        return "iso_unpadded"
    match = SLASH_OR_DASH.match(value)
    if match:
        first, second = int(match.group(1)), int(match.group(2))
        if first > 12 or second > 12:
            return "day_first_or_month_first_unambiguous"
        if first == second:
            return "day_equals_month"
        return "day_month_order_unknown"
    if EXCEL_SERIAL.match(value):
        return "spreadsheet_serial_number"
    if MONTH_ABBREVIATION.match(value):
        return "spreadsheet_mangled_month"
    if PARTIAL_ISO.match(value):
        return "partial_iso_no_year"
    return "other"


def read_core(directory: Path) -> tuple[list[dict[str, str]], list[str]]:
    core = next(path for path in sorted(directory.iterdir()) if path.suffix in {".txt", ".csv", ".tsv"})
    with core.open(encoding="utf-8", errors="replace") as handle:
        delimiter = "\t" if handle.readline().count("\t") > 3 else ","
    with core.open(encoding="utf-8", errors="replace") as handle:
        reader = csv.DictReader(handle, delimiter=delimiter)
        headers = list(reader.fieldnames or [])
        return list(reader), headers


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work", type=Path, required=True)
    arguments = parser.parse_args()

    dates: collections.Counter[str] = collections.Counter()
    coordinates: collections.Counter[str] = collections.Counter()
    context: collections.Counter[str] = collections.Counter()
    per_dataset: list[dict[str, object]] = []
    csv.field_size_limit(10**7)

    for directory in sorted((arguments.work / "extracted").iterdir()):
        if not directory.is_dir():
            continue
        rows, headers = read_core(directory)
        record_path = OUT / f"{directory.name}.json"
        title = json.loads(record_path.read_text(encoding="utf-8")).get("title", directory.name) if record_path.exists() else directory.name

        local: collections.Counter[str] = collections.Counter()
        has_event_date = "eventDate" in headers
        for row in rows:
            if has_event_date:
                verdict = classify_date((row.get("eventDate") or "").strip())
                dates[verdict] += 1
                local[f"date:{verdict}"] += 1
                if verdict == "empty" and (row.get("verbatimEventDate") or "").strip():
                    context["empty_eventDate_with_verbatim"] += 1
                if verdict == "empty" and (row.get("year") or "").strip():
                    context["empty_eventDate_with_year"] += 1

            latitude = (row.get("decimalLatitude") or "").strip()
            longitude = (row.get("decimalLongitude") or "").strip()
            if latitude or longitude:
                if not (latitude and longitude):
                    coordinates["incomplete_pair"] += 1
                elif not (NUMBER.match(latitude) and NUMBER.match(longitude)):
                    coordinates["not_a_number"] += 1
                else:
                    lat, lon = float(latitude), float(longitude)
                    coordinates["pairs_checked"] += 1
                    if abs(lat) > 90 or abs(lon) > 180:
                        coordinates["out_of_range"] += 1
                    if lat == 0 and lon == 0:
                        coordinates["zero_zero"] += 1
                    if "." not in latitude and "." not in longitude and (lat or lon):
                        coordinates["whole_degrees_only"] += 1

            if "locality" in headers and not (row.get("locality") or "").strip():
                context["empty_locality"] += 1
                if any((row.get(name) or "").strip() for name in GEOGRAPHY_FALLBACKS):
                    context["empty_locality_with_other_geography"] += 1

        per_dataset.append({"key": directory.name, "title": title, "rows": len(rows), "counts": dict(local)})

    lines = ["# Aggregate measurements", "", "## Date syntaxes in `eventDate`", "", "| syntax | values |", "|---|---:|"]
    for name, count in dates.most_common():
        lines.append(f"| {name} | {count:,} |")
    lines += ["", "## Coordinates", "", "| measurement | values |", "|---|---:|"]
    for name, count in coordinates.most_common():
        lines.append(f"| {name} | {count:,} |")
    lines += ["", "## Is the information really missing?", "", "| measurement | rows |", "|---|---:|"]
    for name, count in context.most_common():
        lines.append(f"| {name} | {count:,} |")

    (OUT / "aggregate-notes.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (OUT / "aggregate-per-dataset.json").write_text(json.dumps(per_dataset, indent=2) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
