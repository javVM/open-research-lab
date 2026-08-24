"""Turn the run records in out/ into the dataset catalogue and the aggregate tables.

Writes:
  docs/validation/dataset-catalog.csv   one row per dataset
  out/aggregate.md                      per-code totals, pasted into the report by hand

The distinction the report depends on: `findings` counts problem *kinds*, `affected` counts the
rows or values inside them. A single duplicate-identifier finding can cover hundreds of rows.

Usage: python3 summarise.py
"""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
CATALOG = HERE.parent.parent / "docs" / "validation" / "dataset-catalog.csv"

COLUMNS = [
    "institution",
    "collection",
    "domain",
    "platform",
    "source_url",
    "dataset_id",
    "dataset_doi",
    "format",
    "license",
    "downloaded_at",
    "published",
    "archive_sha256",
    "record_count",
    "column_count",
    "validator_run",
    "exit_code",
    "error_findings",
    "warning_findings",
    "affected_rows",
    "concepts_detected",
    "identifier_column",
    "unrecognised_headings",
    "notes",
]


def licence_label(url: str | None) -> str:
    if not url:
        return "unstated"
    known = {
        "creativecommons.org/publicdomain/zero": "CC0-1.0",
        "creativecommons.org/licenses/by/4.0": "CC-BY-4.0",
        "creativecommons.org/licenses/by-nc/4.0": "CC-BY-NC-4.0",
    }
    for fragment, label in known.items():
        if fragment in url:
            return label
    return url


def main() -> int:
    generated = {"aggregate-per-dataset.json"}
    records = [
        json.loads(path.read_text(encoding="utf-8"))
        for path in sorted(OUT.glob("*.json"))
        if not path.name.endswith(".report.json") and path.name not in generated
    ]
    rows: list[dict[str, object]] = []
    by_code: dict[str, dict[str, int]] = defaultdict(lambda: {"datasets": 0, "findings": 0, "affected": 0})
    total_rows = 0

    for record in records:
        report_name = record.get("report_file")
        report = json.loads((OUT / str(report_name)).read_text(encoding="utf-8")) if report_name else None

        affected = 0
        errors = warnings = 0
        if report is not None:
            for finding in report["findings"]:
                affected += int(finding["count"])
                if finding["severity"] == "error":
                    errors += 1
                else:
                    warnings += 1
                entry = by_code[finding["code"]]
                entry["datasets"] += 1
                entry["findings"] += 1
                entry["affected"] += int(finding["count"])
            total_rows += int(report["rowCount"])

        rows.append(
            {
                "institution": record.get("institution", ""),
                "collection": record.get("title", ""),
                "domain": record.get("domain", ""),
                "platform": record.get("platform", ""),
                "source_url": record.get("source_url", ""),
                "dataset_id": record.get("key", ""),
                "dataset_doi": record.get("dataset_doi", ""),
                "format": f"DwC-A ({record.get('core_delimiter', '?')}-separated core)",
                "license": licence_label(record.get("license")),
                "downloaded_at": record.get("downloaded_at", ""),
                "published": str(record.get("published", ""))[:10],
                "archive_sha256": record.get("archive_sha256", ""),
                "record_count": report["rowCount"] if report else record.get("core_lines", ""),
                "column_count": report["columnCount"] if report else "",
                "validator_run": "yes" if report else "no",
                "exit_code": record.get("validator", {}).get("exit_code", "") if isinstance(record.get("validator"), dict) else "",
                "error_findings": errors,
                "warning_findings": warnings,
                "affected_rows": affected,
                "concepts_detected": " ".join(c["concept"] for c in report["detectedColumns"]) if report else "",
                "identifier_column": (report["identifierColumn"] or "none") if report else "",
                "unrecognised_headings": len(report["unrecognisedHeaders"]) if report else "",
                "notes": record.get("error", ""),
            }
        )

    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    with CATALOG.open("w", encoding="utf-8", newline="\n") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda row: (str(row["domain"]), str(row["institution"]))))

    lines = [
        f"datasets: {len(rows)}  rows checked: {total_rows:,}",
        "",
        "| code | datasets | findings | affected rows or values |",
        "|---|---:|---:|---:|",
    ]
    for code, entry in sorted(by_code.items(), key=lambda item: -item[1]["affected"]):
        lines.append(f"| {code} | {entry['datasets']} | {entry['findings']} | {entry['affected']:,} |")
    (OUT / "aggregate.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
