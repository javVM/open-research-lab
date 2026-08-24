"""List candidate datasets from the GBIF registry, one line per candidate.

Selection is deliberately dumb: search a domain keyword, keep occurrence datasets that publish
their own Darwin Core Archive and hold few enough records to resemble a small collection's
export. Judgement about which candidates enter the sample stays with a human, in datasets.json.

Usage: python3 select_candidates.py > candidates.tsv
"""

from __future__ import annotations

import sys

import gbif

QUERIES = {
    "herbarium": ["herbarium", "herbario", "vascular plants collection", "bryophyte herbarium"],
    "paleontology": ["paleontology collection", "fossil collection", "palaeontological", "fossil invertebrates"],
    "general": ["entomology collection", "vertebrate collection", "geology collection", "malacology collection"],
}

MIN_RECORDS = 200
MAX_RECORDS = 150_000


def main() -> int:
    print("domain\trecords\tkey\tpublisher\ttitle\tarchive", file=sys.stdout)
    seen: set[str] = set()
    for domain, queries in QUERIES.items():
        for query in queries:
            try:
                results = gbif.search_datasets(query, limit=40)
            except Exception as error:  # noqa: BLE001 - research script, report and continue
                print(f"# search failed for {query!r}: {error}", file=sys.stderr)
                continue
            for result in results:
                key = result["key"]
                if key in seen:
                    continue
                seen.add(key)
                try:
                    meta = gbif.dataset(key)
                    archive = gbif.archive_endpoint(meta)
                    if archive is None:
                        continue
                    count = gbif.dataset_record_count(key)
                except Exception as error:  # noqa: BLE001
                    print(f"# lookup failed for {key}: {error}", file=sys.stderr)
                    continue
                if not MIN_RECORDS <= count <= MAX_RECORDS:
                    continue
                title = str(meta.get("title", "")).replace("\t", " ")
                publisher = str(meta.get("publishingOrganizationKey", ""))
                print(f"{domain}\t{count}\t{key}\t{publisher}\t{title}\t{archive}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
