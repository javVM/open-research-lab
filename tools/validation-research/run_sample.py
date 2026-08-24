"""Download every dataset in datasets.json, run collection-validator over it, keep the evidence.

Nothing is redistributed: the archives and extracted files stay in the work directory (outside
the repository) and only metadata, hashes and validator output are written to `out/`.

Usage:
    python3 run_sample.py --work /home/ubuntu/dsval --out out
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import gbif

HERE = Path(__file__).resolve().parent
VALIDATOR = HERE.parent / "collection-validator"


def row_count(path: Path) -> int:
    """Physical lines minus the header. Not the same as records when values contain newlines."""
    lines = 0
    with path.open("rb") as handle:
        while chunk := handle.read(1 << 22):
            lines += chunk.count(b"\n")
    return max(lines - 1, 0)


def run_validator(csv_path: Path, delimiter: str, json_out: Path) -> dict[str, object]:
    delimiter_argument = "tab" if delimiter == "\t" else delimiter
    started = time.monotonic()
    completed = subprocess.run(
        [
            "npm",
            "run",
            "--silent",
            "validate",
            "--",
            str(csv_path),
            "--delimiter",
            delimiter_argument,
            "--quiet",
            "--json",
            str(json_out),
        ],
        cwd=VALIDATOR,
        capture_output=True,
        text=True,
        timeout=1800,
    )
    return {
        "exit_code": completed.returncode,
        "seconds": round(time.monotonic() - started, 1),
        "stderr": completed.stderr.strip()[:2000],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work", type=Path, required=True, help="scratch directory, outside the repo")
    parser.add_argument("--out", type=Path, default=HERE / "out", help="where run records are written")
    parser.add_argument("--only", type=str, default=None, help="run a single dataset key")
    arguments = parser.parse_args()

    manifest = json.loads((HERE / "datasets.json").read_text(encoding="utf-8"))
    arguments.out.mkdir(parents=True, exist_ok=True)

    for entry in manifest["datasets"]:
        key = entry["key"]
        if arguments.only is not None and key != arguments.only:
            continue
        record_path = arguments.out / f"{key}.json"
        if record_path.exists():
            print(f"= {key} already done", flush=True)
            continue

        record: dict[str, object] = {"key": key, "domain": entry["domain"], "platform": entry["platform"]}
        try:
            meta = gbif.dataset(key)
            organization = gbif.organization(meta["publishingOrganizationKey"])
            archive_url = gbif.archive_endpoint(meta)
            if archive_url is None:
                raise ValueError("no Darwin Core Archive endpoint")
            record.update(
                title=meta.get("title"),
                dataset_doi=meta.get("doi"),
                license=meta.get("license"),
                published=meta.get("pubDate"),
                created=meta.get("created"),
                institution=organization.get("title"),
                country=organization.get("country"),
                source_url=f"https://www.gbif.org/dataset/{key}",
                archive_url=archive_url,
                gbif_record_count=gbif.dataset_record_count(key),
                downloaded_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            )

            archive = arguments.work / "archives" / f"{key}.zip"
            record["archive_sha256"] = gbif.download(archive_url, archive)
            record["archive_bytes"] = archive.stat().st_size

            core, row_type, delimiter = gbif.core_file(archive, arguments.work / "extracted" / key)
            record.update(
                core_file=core.name,
                core_row_type=row_type,
                core_delimiter="tab" if delimiter == "\t" else delimiter,
                core_lines=row_count(core),
            )

            report_path = arguments.out / f"{key}.report.json"
            record["validator"] = run_validator(core, delimiter, report_path)
            if report_path.exists():
                record["report_file"] = report_path.name
        except Exception as error:  # noqa: BLE001 - a failed dataset is a result, not a crash
            record["error"] = f"{type(error).__name__}: {error}"
            print(f"! {key} {record['error']}", file=sys.stderr, flush=True)

        record_path.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"+ {key} {record.get('title', '')[:60] if record.get('title') else ''}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
