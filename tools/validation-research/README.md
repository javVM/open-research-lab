# validation-research

Throwaway analysis scripts used to test the collection-data hygiene hypothesis against published
collection datasets. The write-up is
[docs/validation/public-dataset-validation.md](../../docs/validation/public-dataset-validation.md).

These are research scripts, not product code and not a tool anyone is expected to use. They are
Python 3 with the standard library only, and they exist so the numbers in the report can be
re-derived rather than trusted.

## What each script does

| Script | Purpose |
|---|---|
| `gbif.py` | GBIF registry/occurrence API helpers, archive download, SHA-256, Darwin Core core extraction driven by `meta.xml` |
| `select_candidates.py` | Searches the registry by domain keyword and prints candidate datasets as TSV |
| `datasets.json` | The 26 hand-picked datasets, with the domain and platform labels used in the report |
| `run_sample.py` | Downloads each archive, extracts the declared core, runs `collection-validator`, writes a run record and a JSON report per dataset |
| `analyse_findings.py` | Measures the extracted cores directly (date syntaxes, coordinates, missing-field context), independently of the validator |
| `summarise.py` | Aggregates the run records into `docs/validation/dataset-catalog.csv` |

## Running

```bash
cd tools/validation-research
python3 run_sample.py --work /tmp/dsval        # network: downloads archives from GBIF publishers
python3 analyse_findings.py --work /tmp/dsval
python3 summarise.py
```

`--work` is a scratch directory that must live outside the repository: downloaded archives and
extracted cores are third-party data under their own licences and are never committed. Only
metadata, hashes, source URLs and validator output reach `docs/validation/`.

`run_sample.py --only <dataset-key>` reruns a single dataset. Existing run records are skipped, so
an interrupted sample can be resumed.

Generated output (`out/`, `candidates.tsv`) is ignored by git.
