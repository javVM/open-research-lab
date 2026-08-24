# Public-dataset validation of the Collection Validator hypothesis

Status: complete. Date: 2026-08-23. Author: agent-assisted desk research.

No person was contacted for this study. There are no interviews, no user quotes, no feedback and
no willingness-to-pay data in this document, because none exist. Everything here comes from
public datasets, public documentation of other software, and published literature.

Every substantive claim is tagged **FACT** (measured or directly cited), **INFERENCE**
(reasoning from facts, could be wrong) or **OPEN QUESTION** (cannot be answered from public data).

---

## 1. Executive summary

We downloaded 26 published natural-history collection datasets (8 herbarium, 10 palaeontology,
8 zoology/entomology/malacology) from 20 different publishing platforms, ran
`tools/collection-validator` over 24 of them, and measured 224,091 rows.

The four questions this study was commissioned to answer:

1. **Are real data messy enough to justify validation tooling?**
   Partly. **FACT:** identifier and date problems are common and concrete — 4 of 24 datasets
   contain duplicate catalogue numbers, 4 contain rows with no catalogue number at all, and
   1,983 date values across two datasets are visibly spreadsheet-damaged (Excel serial numbers
   such as `31929`, or `Mar-99` where a year was meant). **FACT:** coordinate problems are
   effectively absent — of 95,205 coordinate pairs, **zero** were out of range and **zero** were
   `0,0`. The coordinate checks, which are a third of the validator's headline features, fired
   three times in total.
2. **Are those problems what the target user needs to fix?**
   **OPEN QUESTION** for most of them. Duplicate and missing catalogue numbers are unambiguously
   actionable; spreadsheet-corrupted dates are unambiguously data loss. "Missing locality" and
   "missing date" are frequently *descriptive of the collection*, not defects: 34.6% of rows with
   an empty locality carry other geography, and 15.9% of rows with an empty `eventDate` hold the
   date in another column.
3. **Does the validator detect a significant share of the problems?**
   Partly, and its largest warning class is mostly noise. **FACT:** of 44,437 `unrecognised-date`
   values, roughly 87% are dates the validator should have understood — ISO 8601 ranges
   (`1948-06-21/1948-06-21`, 19,063 values) and unpadded ISO dates (`2007-3-4`, 11,324 values).
   Only ~4.5% are genuine corruption.
4. **Is there public evidence that the pain is severe enough to drive adoption?**
   **NO — THIS CANNOT BE DETERMINED WITH PUBLIC DATASETS.** Dataset defects are evidence that
   defects exist, not evidence that anyone will adopt a tool to fix them.

**Decision: PROCEED WITH CHANGES on the technical artefact; INSUFFICIENT EVIDENCE on the market.**

The technical hypothesis survives in a narrower form: the value is in *identifiers and
spreadsheet damage*, not in coordinates. The market hypothesis is untouched by this work and
still requires the conversations in
[docs/product/user-validation.md](../product/user-validation.md).

---

## 2. Hypotheses tested

| # | Hypothesis | Verdict | Basis |
|---|---|---|---|
| H1 | Real small-collection data contain detectable quality problems | **SUPPORTED, with a caveat that matters** | 24/24 datasets produced at least one finding; but published data have already passed a publication pipeline (§9.1) |
| H2 | The detected problems are relevant to a collection's workflow | **PARTIALLY SUPPORTED / OPEN QUESTION** | Identifier and corruption findings are actionable by inspection; completeness warnings often describe the collection rather than a defect |
| H3 | Current coverage is sufficient to be useful | **NOT SUPPORTED as built** | Coordinate checks found 3 issues in 95,205 pairs; date checks are 87% noise; three recurring real problems are not detected at all (§9) |
| H4 | The validator produces useful signal, not noise | **NOT SUPPORTED for dates; SUPPORTED for identifiers** | §8 quantifies the false-positive rate per check |
| H5 | What should be validated next | Answered in §10 as a matrix, with three ADD recommendations and four FIX recommendations |

---

## 3. Methodology

1. Queried the GBIF registry API for occurrence datasets by domain keyword, keeping only
   datasets with a Darwin Core Archive endpoint and between 200 and 150,000 records
   (`tools/validation-research/select_candidates.py`, 300 candidates).
2. Hand-picked 26 from those candidates (`datasets.json`), deliberately spreading across domain,
   publishing platform, institution size and publication date.
3. For each dataset: fetched registry metadata and the publishing organisation, downloaded the
   archive, recorded its SHA-256, extracted **only** the core file declared by `meta.xml`, and
   ran the validator with the delimiter declared in `meta.xml`
   (`run_sample.py`). The validator was run unchanged, read-only, offline apart from the
   downloads, with `--json`.
4. Aggregated the JSON reports (`summarise.py` → `dataset-catalog.csv`) and then measured the
   underlying values independently of the validator (`analyse_findings.py`) so that a finding
   count could be split into true positives, false positives and mislabelled findings.
5. Reviewed samples of every finding class by hand against the source values (§8).

**Transformation applied to each dataset (documented as required):** a Darwin Core Archive is a
ZIP; we extracted the single core text file named in `meta.xml` and passed it to the validator
with the declared field delimiter (tab in 21 cases, comma in 3). No column was renamed, no value
was edited, no row was dropped. Nothing else was extracted; extension files (identifications,
multimedia) were ignored.

**Validator version.** The validator was run at commit `409bfcb` ("Fix false positives in date
checks and dead heading check"), the head of `devin/1787521136-collection-validator-prototype`
after PR #3 review fixes. No source file in `tools/collection-validator/src/` changed between that
commit and the study.

**Products, not touched.** No product code was written. The validator was not modified for this
study — not even to make a dataset fit. The research scripts live in
`tools/validation-research/` and are separate from `tools/collection-validator/`.

**Licensing.** No dataset is redistributed here. Archives and extracted cores stayed outside the
repository (`/home/ubuntu/dsval`); only metadata, SHA-256 hashes, source URLs, licences and
validator output are committed. Licences of the 26: 12 CC-BY-4.0, 9 CC-BY-NC-4.0, 5 CC0-1.0.

### 3.1 Reproducing

```bash
cd tools/validation-research
python3 select_candidates.py > candidates.tsv         # optional, re-discovers candidates
python3 run_sample.py --work /tmp/dsval               # downloads, extracts, runs the validator
python3 analyse_findings.py --work /tmp/dsval         # measures the values themselves
python3 summarise.py                                  # writes docs/validation/dataset-catalog.csv
```

Standard library only, no dependencies. Byte-for-byte reproduction is not guaranteed: publishers
republish archives, so `record_count` and hashes drift. The hashes in the run records identify
exactly what we measured.

---

## 4. Dataset selection criteria

Priority order, as instructed: downloadable tabular data first, collection-management-system
exports next, then Darwin Core Archives, then aggregator repositories, small institutions before
large ones.

**What we could actually get, and why it is a compromise.** We found no public source of raw,
pre-publication collection spreadsheets. The nearest available proxy is a Darwin Core Archive
published directly by the institution's own collection-management system — Symbiota, Specify,
Arctos or an IPT instance — because that archive is generated from the working database rather
than from an aggregator's cleaned index. That is what we used: 24 of 26 come straight from an
institutional publishing endpoint, not from a GBIF-processed download.

Inclusion: occurrence datasets, 200–150,000 records, institutional publisher, DwC-A endpoint
reachable without credentials. Exclusion: aggregator-processed downloads (GBIF's own interpreted
snapshots), datasets over 150,000 records, checklists, sampling-event-only datasets.

**Consequence, stated up front (INFERENCE):** these files have all passed a publication step that
rejects or repairs some classes of error. Anything absent from them may be absent because
publication removed it, not because collections do not produce it. §9.1 quantifies where this
almost certainly happened.

---

## 5. Dataset inventory

Full inventory with metadata, licences, hashes and per-dataset counts:
[`dataset-catalog.csv`](dataset-catalog.csv).

| Domain | Datasets | Rows validated |
|---|---:|---:|
| Herbarium / botanical | 8 | 105,132 |
| Palaeontology | 10 | 16,319 |
| Zoology / entomology / malacology / general | 8 | 102,640 |
| **Total selected 26; validated 24** | | **224,091** |

Publishing platforms represented: Symbiota (4), Arctos (3), Specify direct export (2),
IPT instances (14, at 13 different institutions or national nodes), JACQ/BioCASe (1).
Institutions span 14 countries. Publication dates span 2016-12 to 2026-08.

**Two datasets could not be validated (FACT).** University of Nevada Reno Museum of Natural
History (Arctos): `HTTP 403 Forbidden` on the archive endpoint. Academy of Natural Sciences of
Philadelphia Invertebrate Paleontology (self-hosted IPT): TCP connection timed out. Both are
recorded in the catalogue with `validator_run=no`. We did not work around either, because the
failure is the publisher's endpoint, not our tooling.

---

## 6. Results by dataset

Per-dataset findings, as reported by the validator. `err`/`warn` count finding *kinds*;
`affected` counts the rows or values inside them — these are very different numbers and the
distinction is load-bearing for the rest of this document.

| Domain | Collection | Rows | Cols | err | warn | affected | Largest finding |
|---|---|---:|---:|---:|---:|---:|---|
| herb | Comisión nacional (SERO herbarium, MX) | 12,074 | 89 | 0 | 4 | 12,356 | unrecognised-date 12,009 (`30-6-1994`) |
| herb | E.L. Reed Herbarium, Texas Tech (Bryophytes) | 346 | 98 | 2 | 4 | 20 | duplicate + missing catalogue numbers |
| herb | Herbario EEZA (CSIC, ES) | 13,912 | 58 | 3 | 6 | 14,841 | unrecognised-date 12,738 (unpadded ISO + Excel serials) |
| herb | IRKU Herbarium, Irkutsk State University | 42,297 | 76 | 1 | 3 | 11,552 | missing-locality 11,386 |
| herb | Marion Ownbey Herbarium, Washington State | 13,161 | 98 | 2 | 6 | 1,045 | missing-locality 534, missing-identifier 56 |
| herb | Palacký University Olomouc (OL) | 7,249 | 74 | 0 | 3 | 29 | missing-date 27 |
| herb | SANParks Skukuza Herbarium | 15,837 | 34 | 1 | 5 | 6,878 | ambiguous-date 5,769 |
| herb | Universidad Nacional de Colombia (Caribe) | 256 | 57 | 0 | 4 | 9 | unrecognised-date 4 |
| paleo | CENPAT-CONICET Invertebrate Palaeontology | 813 | 36 | 0 | 2 | 911 | missing-date 735 |
| paleo | Canadian Museum of Nature Fossil Invertebrate | 3,356 | 48 | 0 | 3 | 4,093 | missing-locality 3,356 (whole column empty) |
| paleo | Fort Hays Sternberg Museum | 2,568 | 55 | 0 | 4 | 2,220 | ambiguous-date 614 + missing-date 991 |
| paleo | Gunma Museum of Natural History | 200 | 95 | 0 | 4 | 202 | missing-date 196 |
| paleo | Ohio University Invertebrate Palaeontology | 2,412 | 37 | 0 | 2 | 3 | missing-locality 2 |
| paleo | Ohio Wesleyan University Palaeontology | 372 | 91 | 0 | 3 | 374 | unrecognised-date 372 (all ISO ranges) |
| paleo | Science Museum of Minnesota Palaeontology | 3,272 | 34 | 0 | 4 | 2,325 | unrecognised-date 2,284 (`1970/1996`) |
| paleo | Teylers Museum Solnhofen | 2,993 | 43 | 0 | 2 | 9 | mixed-values-in-column 8 |
| paleo | Trinity College Dublin Geological Museum | 333 | 91 | 0 | 5 | 350 | unrecognised-date 301 (ISO ranges) |
| gen | Alabama Museum of Natural History Insects | 15,496 | 91 | 0 | 4 | 15,503 | unrecognised-date 15,496 (every row an ISO range) |
| gen | Ghent University Nematode Collection | 3,803 | 33 | 0 | 5 | 4,579 | missing-locality 2,402, missing-date 2,091 |
| gen | MNCN Malacology (CSIC, ES) | 17,573 | 24 | 0 | 1 | 190 | missing-locality 190 |
| gen | MIZ PAS Reptilia (PL) | 420 | 49 | 0 | 4 | 341 | missing-date 244 |
| gen | Natural History Museum Aarhus Vertebrates | 24,695 | 25 | 1 | 2 | 9 | *core has no header row* (§7.3) |
| gen | San Jose State University Vertebrates | 3,311 | 98 | 2 | 4 | 1,209 | missing-locality 722, duplicate-identifier 39 |
| gen | UWBM Malacology (Burke Museum) | 37,342 | 40 | 0 | 2 | 17 | *core has no header row* (§7.3) |

---

## 7. Aggregate findings

### 7.1 By finding code

24 datasets, 224,091 rows.

| Code | Severity | Datasets | Findings | Affected rows/values |
|---|---|---:|---:|---:|
| unrecognised-date | warning | 13 | 13 | 44,437 |
| missing-locality | warning | 17 | 17 | 20,719 |
| missing-date | warning | 17 | 17 | 6,757 |
| ambiguous-date | warning | 3 | 3 | 6,384 |
| mixed-values-in-column | warning | 12 | 12 | 462 |
| missing-identifier | error | 4 | 4 | 185 |
| duplicate-identifier | error | 4 | 4 | 46 |
| impossible-date | error | 2 | 2 | 27 |
| blank-column-heading | warning | 2 | 2 | 23 |
| several-columns-matched | warning | 19 | 19 | 19 |
| duplicate-column-heading | error | 1 | 1 | 3 |
| longitude-not-a-number | error | 1 | 1 | 2 |
| incomplete-coordinate-pair | warning | 1 | 1 | 1 |
| no-identifier-column | warning | 2 | 2 | 0 |

Checks that never fired on 224,091 rows: `latitude-out-of-range`, `longitude-out-of-range`,
`zero-coordinates`, `latitude-not-a-number`, `latitude-not-decimal`, `longitude-not-decimal`,
`empty-row`, `duplicate-row`, `untidy-column-heading`, `wrong-number-of-values`, `future-date`.

### 7.2 Independent measurement of the values

Measured directly from the cores, not from the validator's output.

`eventDate` syntax census (values, all datasets with an `eventDate` column):

| Syntax | Values | Comment |
|---|---:|---|
| ISO `YYYY[-MM[-DD]]` | 72,532 | correct |
| ISO 8601 range `YYYY-MM-DD/YYYY-MM-DD` | 19,063 | valid Darwin Core; the validator does not understand it |
| day/month order unambiguous (`30-6-1994`, one part > 12) | 17,364 | parseable without guessing |
| unpadded ISO (`2007-3-4`) | 11,324 | unambiguous; the validator does not understand it |
| day/month order genuinely unknown (`04/05/1998`) | 9,010 | needs a human or a per-dataset convention |
| empty | 6,757 | |
| spreadsheet serial number (`31929`) | 1,399 | **spreadsheet damage** |
| day equals month (`04/04/2014`) | 968 | order is irrelevant; flagging it is pure noise |
| spreadsheet-mangled month (`Mar-99`) | 584 | **spreadsheet damage** |
| partial ISO without year (`--06-15`) | 25 | ISO-legal, rare |
| other | 50 | |

Coordinates:

| Measurement | Value |
|---|---:|
| Coordinate pairs present and numeric | 95,205 |
| Out of range (\|lat\| > 90 or \|lon\| > 180) | **0** |
| Exactly `0,0` | **0** |
| Non-numeric coordinate values | 2 |
| Incomplete pairs (one of two present) | 1 |
| Whole degrees only, i.e. ~111 km precision | 3,307 |

Is the "missing" information really missing?

| Measurement | Rows |
|---|---:|
| Empty `locality` (where a `locality` column exists) | 9,333 |
| …of which other geography is populated | 3,228 (34.6%) |
| Empty `eventDate` with `verbatimEventDate` populated | 989 |
| Empty `eventDate` with `year` populated | 84 |

### 7.3 Two datasets exposed a methodological limit, not a data problem

**FACT:** the cores of the Aarhus and UWBM archives declare no `ignoreHeaderLines`, i.e. they
have **no header row** — the first line is data. The validator, whose contract is "first row is
the header", therefore read a specimen record as column names and reported
`duplicate-column-heading "1966-10-18" appears 2 times`, six blank headings and
`no-identifier-column`. That is a correct consequence of a documented assumption, and the output
made the problem obvious rather than silently producing nonsense.

We excluded these two datasets' 62,037 rows from the value-level measurements in §7.2 (their
columns cannot be identified) but kept them in §7.1. **INFERENCE:** this is a Darwin Core
Archive property, not a spreadsheet property — a CSV exported from Symbiota, Specify or Excel
always carries a header row — so it is not a reason to change the validator.

---

## 8. False-positive review

Every finding class was sampled against the source values. Classification and, where the class is
large, a measured split rather than an impression.

| Finding class | Sample verdict | Measured basis |
|---|---|---|
| `duplicate-identifier` (46 values, 4 datasets) | **TRUE POSITIVE** | For all 46, the duplicate rows are *not* identical records — different localities, dates or taxa share one catalogue number. Actionable without any context we lack. |
| `missing-identifier` (185 rows, 4 datasets) | **TRUE POSITIVE** | Rows carry taxon and locality data but an empty `catalogNumber`. |
| `impossible-date` (27 values) | **TRUE POSITIVE** | `2002-06-31` (3, a day that does not exist) and `0/0/0` (24). |
| `longitude-not-a-number` (2) | **TRUE POSITIVE** | `2331DD` — a South African quarter-degree grid code in a decimal-longitude column. |
| `unrecognised-date` (44,437) | **87% FALSE POSITIVE** | ISO 8601 ranges 19,063 + unpadded ISO 11,324 + unambiguous dash-separated day-first 8,353 = 38,740 values the validator should read. 3,656 more (8%) are genuinely ambiguous — right to flag, wrong message. Only ~2,000 (4.5%) are true positives (Excel serials, `Mar-99`). |
| `ambiguous-date` (6,384) | **MOSTLY TRUE POSITIVE, 12% NOISE** | 747 values have day equal to month (`04/04/2014`), where the order cannot change the meaning. The remaining 5,637 are genuinely undecidable from the value alone. |
| `missing-date` (6,757) | **TRUE POSITIVE for 84%, NOT ACTIONABLE for 16%** | 1,073 rows hold the date in `verbatimEventDate` or `year`. The other 5,684 have no date anywhere — for a fossil or an old herbarium sheet that is often a fact about the specimen, not an error. |
| `missing-locality` (20,719) | **AMBIGUOUS** | 34.6% of empty-locality rows carry country/state/county/verbatim geography. One dataset (Canadian Museum of Nature) has an empty `locality` column in all 3,356 rows: one column-level fact reported 3,356 times. |
| `mixed-values-in-column` (462) | **MIXED** | Not actionable in catalogue-number columns, where `24793a`, `32489-A`, `B.3`, `05536 01` are ordinary suffixes. Genuinely useful where the value is a placeholder (`s/n`, `?`, `FALSE`) or a range in a date column (`1866-1867`, `September 2024`). |
| `several-columns-matched` (19 datasets) | **TRUE POSITIVE, and it caught a real defect** | Almost always `verbatimLocality`/`verbatimEventDate`. In IRKU Herbarium the validator *chose* `verbatimLocality` as the locality column because it appears first, and reported 11,386 missing localities from the verbatim field while the interpreted `locality` column existed. Column-order-dependent choice is a defect (§10, FIX). |
| `blank-column-heading`, `duplicate-column-heading`, `no-identifier-column` | **TRUE POSITIVE about the file** | Only fired on the two headerless cores (§7.3). |

### 8.1 Alias investigation: `leg`, `location`, and identifier variants

The task asked specifically what `leg`, `location`, and various identifier column names mean in
real collection data. The answer from this sample is constrained by its composition: all 24
validated datasets are Darwin Core Archives, so their column names are Darwin Core terms, not
spreadsheet labels. This is itself a finding about the gap between the validator's alias list and
the data we could obtain.

**`leg` (FACT).** No dataset in the sample contains a column named `leg`. All 24 use the Darwin
Core term `recordedBy`, which the validator already recognises as an alias for `collector`. The
`leg` alias (short for *legit*, a botanical convention for the person who collected the specimen)
is designed for pre-publication spreadsheet exports, not DwC-A files. **INFERENCE:** `leg` is
likely to appear in herbarium spreadsheet exports from institutions that have not yet adopted
Darwin Core column names, but this sample cannot confirm it. **OPEN QUESTION:** whether `leg` is
ever used in a non-botanical context to mean something other than collector. The alias is harmless
if it never matches; it is wrong only if a zoological or palaeontological dataset uses `leg` for
anatomical measurements or specimen-part descriptions.

**`location` (FACT).** No dataset in the sample contains a column named `location`. All 24 use
`locality` (the Darwin Core term), which the validator recognises. The `location` alias is designed
for spreadsheet exports where the column may be named `Location` or `location` instead of
`locality`. **FACT:** in every dataset where a locality-type column exists, its values are
geographic collecting localities (place names, coordinates descriptions, verbatim locality text),
never physical storage locations. **INFERENCE:** the `location` alias is semantically correct for
collecting locality in the context of pre-publication spreadsheets, but the validator's label
("locality") should not be interpreted as storage location. The Sample Operations product
hypothesis about physical storage location tracking is not testable with this data (§12.3).

**Identifier types beyond `catalogNumber` and `occurrenceID` (FACT).** The validator recognises
`catalogNumber`, `occurrenceId`, and their aliases (`catalogNo`, `catalogNr`, `specimenNumber`,
`specimenNo`, `specimenId`, `specimenCode`, `occurrenceID`, `occurrenceKey`, `occID`). It does
not recognise `accessionNumber`, `recordNumber`, `fieldNumber`, `institutionCode`, or
`collectionCode`. In the sample:

- `recordNumber` appears in 16 of 24 datasets as a Darwin Core column. It typically holds the
  collector's own field number, distinct from the institutional catalogue number. The validator
  ignores it.
- `institutionCode` and `collectionCode` appear in all 24 datasets. They are categorical columns
  (e.g. `MNCN`, `MNCN-Malac`), not record identifiers.
- `accessionNumber` does not appear in any DwC-A file. **INFERENCE:** it may appear in
  pre-publication spreadsheet exports from museums that use accession-based workflows, but DwC
  maps accession numbers to `catalogNumber` or `otherCatalogNumbers`.
- `fieldNumber` appears in 12 datasets. Like `recordNumber`, it holds a collector-assigned number.

**INFERENCE:** the validator's identifier detection is adequate for Darwin Core data (it found the
identifier column in 22 of 24 datasets). The unrecognised identifier types (`recordNumber`,
`fieldNumber`, `accessionNumber`) are secondary identifiers, not the primary record key, and
adding them as aliases for `catalogNumber` would be semantically wrong — they are different
concepts. **OPEN QUESTION:** whether pre-publication spreadsheets use `accessionNumber` as the
primary identifier column instead of `catalogNumber`.

**Mixed numeric/alphanumeric catalogue numbers (FACT).** The `mixed-values-in-column` check fired
on 12 datasets, and inspection shows that in all 12 cases the flagged column is either the
catalogue number itself or a related identifier. Values like `24793a`, `32489-A`, `B.3`,
`05536 01` are ordinary suffixes, not type errors. The current "mixed numeric values" warning is
mostly noise on real identifier columns. This is addressed in the recommendation matrix (§10:
exclude the identifier column from this check).

**Overall signal-to-noise (FACT):** of 79,065 affected rows/values reported across 24 datasets,
approximately 40,200 (51%) are values the validator should not have flagged at all, and a further
~4,700 are flagged for the right reason with the wrong explanation. Almost all of that noise sits
in two date checks. Identifier checks produced no false positives in this sample.

---

## 9. Coverage gaps

### 9.1 The coordinate checks are aimed at a problem that is not in this data

**FACT:** 0 out-of-range and 0 zero-coordinates in 95,205 pairs.
**INFERENCE:** this is selection bias, not proof that collections do not produce bad coordinates.
GBIF's publishing pipeline flags `COORDINATE_OUT_OF_RANGE`, `ZERO_COORDINATE` and
`COORDINATE_INVALID` [1], and publishers see those flags before we do; the IPT-generated archive
is typically the output of a database that already rejects impossible values. Our sample cannot
distinguish "collections do not make this mistake" from "the mistake was fixed upstream".

**OPEN QUESTION:** what fraction of *unpublished* working spreadsheets contain out-of-range or
transposed coordinates. Only a real export from a collection that has never published can answer
it. This is the single most important thing this study could not measure.

### 9.2 Problems visibly present that the validator does not detect

| Problem | Occurrences measured | Why it matters |
|---|---:|---|
| Spreadsheet serial numbers in a date column | 1,399 values, 1 dataset | The validator says "unrecognised", not "this looks like an Excel serial number, the original date has been overwritten". The user cannot act on the first message and can on the second. |
| Excel-mangled month/year (`Mar-99` for March 1999) | 584 values, 1 dataset | Same: silent data loss, reported as generic noise. |
| A whole column that is empty | at least 2 datasets (3,356 and 190 rows) | Reported once per row. A column-level statement ("`locality` is empty in every row") is one line instead of thousands. |
| Coordinates rounded to whole degrees | 3,307 values | GBIF reports `COORDINATE_ROUNDED`/precision issues [1]; ~111 km precision presented as a point coordinate is misleading in use. |
| Date stated only in `verbatimEventDate` while `eventDate` is empty | 989 rows | The information exists but is not in the machine-readable field — a mapping problem, arguably the most fixable thing we found. |
| Placeholder values standing in for null (`s/n`, `?`, `not recorded`, `FALSE`) | 462 flagged incidentally, more present | Currently surfaces only as a side effect of the mixed-values check. |

### 9.3 Heading detection on real Darwin Core columns

**FACT:** the validator identified an identifier column in 22 of 24 datasets and 5–7 concepts in
each, out of 24–98 columns. Detection did not misfire on unrelated columns. Its one real defect is
preferring whichever alias appears first, which cost it the correct locality column in one dataset
(§8).

---

## 10. Competitive and tooling comparison

Sources are the vendors' and projects' own documentation.

| Problem | GBIF Data Validator [1] | Symbiota [2] | Specify 7 [3] | `bdc` R package [4] | Our prototype |
|---|---|---|---|---|---|
| Duplicate catalogue numbers | not a check (uniqueness of core `id` is) | dedicated Duplicate Catalog Numbers tool, with merge | Uniqueness Rules + Export Duplicates CSV | no | yes |
| Empty identifier | yes (indexing requirement) | database-level | database-level | `bdc_scientificName_empty` etc. for other fields | yes |
| Coordinates out of range / `0,0` / transposed | yes, plus country–coordinate mismatch, reprojection, precision | Coordinate Validation and Geographic Cleaning tools | schema validation | `bdc_coordinates_outOfRange`, `_transposed`, `_country_inconsistent`, `_precision` | range and numeric format only |
| Date parsing / imprecise dates | yes, over the whole DwC event model | yes, in the editor | yes, on entry | Time module | partial, and 87% noisy (§8) |
| Taxonomic names | yes, against the GBIF backbone | Taxonomic Cleaning Tools | tree validation | taxonomy module, offline matching | no |
| Spreadsheet damage (serials, mangled months) | not as such | no | no | no | not as such |
| Runs offline, no upload, no install of a database | no (hosted service, upload required) | no (portal-hosted) | no (institutional install) | R required | **yes** |
| Works on an arbitrary CSV with non-Darwin-Core headings | CSV must use Darwin Core terms in row 1 | export/import format | own schema | Darwin Core expected | **yes** |

**Where the incumbents fall short for a small collection (INFERENCE, from the documentation
above):** every tool that does this well either requires uploading the data to a service
(GBIF validator), already having the data inside the system (Symbiota, Specify) or being able to
use R (`bdc`). A collection whose data lives in a spreadsheet and is not yet published fits none
of them.

**Where our wedge is weaker than it looked:** the *checks* we implemented are the checks the
incumbents implemented first and better — coordinates and dates. The checks nobody else appears
to run are the spreadsheet-damage ones, which we currently do not really run either (§9.2).

**Is the wedge still valid?** Narrowly, yes: "offline, no upload, arbitrary spreadsheet headings,
before publication". **INFERENCE**, and it stands or falls on whether that constraint —
not the checks themselves — is what a collection manager actually cares about. **OPEN QUESTION.**

### Recommendation matrix

Frequency = datasets out of 24 where it occurred. User value is our judgement, not a measurement.

| Problem | Frequency | Severity | Current validator | False-positive risk | User value | Recommendation |
|---|---:|---|---|---|---|---|
| Duplicate identifiers | 4 | error | detects | none observed | high — actionable, and confirmed distinct records | **KEEP** |
| Missing identifiers | 4 | error | detects | none observed | high | **KEEP** |
| Impossible dates | 2 | error | detects | none observed | high | **KEEP** |
| ISO 8601 date ranges | 8 | not a problem | reports as unrecognised (19,063 values) | certain false positive | negative — it buries real findings | **FIX**: accept as a valid imprecise date |
| Unpadded ISO dates (`2007-3-4`) | 1 | not a problem | reports as unrecognised (11,324) | certain false positive | negative | **FIX**: parse |
| Dash-separated day-first dates (`30-6-1994`) | 1 | ambiguous at most | reports as unrecognised (12,009) | high | negative as worded | **FIX**: treat dashes like slashes, then apply the existing ambiguity logic |
| Day equals month (`04/04/2014`) | 3 | not a problem | reports as ambiguous (747) | certain false positive | negative | **FIX**: suppress when day == month |
| Genuinely ambiguous day/month order | 3 | warning | detects | low after the fixes above | medium — needs a human decision per dataset | **KEEP** |
| Spreadsheet serial numbers in dates | 1 | error-worthy | reports generically | low — the pattern is narrow (4–5 digits in a date column) | high — irreversible data loss, invisible in a spreadsheet | **ADD** |
| Excel-mangled month values (`Mar-99`) | 1 | error-worthy | reports generically | low | high — same | **ADD** |
| A whole column empty | ≥2 | warning | one finding per row | none, but thousands of lines of output | high — turns 3,356 lines into one | **ADD** (report shape, not a new rule) |
| Missing locality per row | 17 | warning | detects | ~35% have other geography | low as worded | **FIX** the wording, or gate on other geography being absent too |
| Missing date per row | 17 | warning | detects | 16% hold the date elsewhere | medium | **FIX**: say "no date in this column; `verbatimEventDate` is populated" when it is |
| Coordinates out of range / `0,0` / non-numeric | 1 (2 values) | error | detects | none | unknown — untestable on published data | **KEEP**, cheap and correct, but stop treating it as a headline |
| Coordinates in DMS | 0 | warning | detects | unknown | unknown | **KEEP** (no cost) |
| Whole-degree coordinate precision | ~14 | warning | no | medium — legitimate for old records | medium | **DEFER**: needs a user to say whether it is useful |
| Placeholder values for null (`s/n`, `?`) | ≥5 | warning | incidental | medium — vocabulary is collection-specific | medium | **DEFER**: no stable meaning without the collection's conventions |
| Mixed values in a catalogue-number column | 12 | warning | detects | high — suffixes are normal | low | **FIX**: exclude the identifier column from this check, or downgrade it |
| Taxonomic name validity | frequent | — | no | — | high but needs a name backbone, i.e. a network call or a bundled dataset | **DEFER** — out of scope by design |
| Duplicate/blank column headings | 2 | error/warning | detects | none | high on real spreadsheets | **KEEP** |
| Empty rows, duplicate rows | 0 | — | detects | none | unknown here; expected in spreadsheets, absent from DwC-A | **KEEP** |

Nothing is recommended for **REMOVE**. Every ADD above meets the four-part test: it recurred, its
meaning is stable, it can be explained in one sentence, and it needs no private context.

---

## 11. What the evidence supports

1. **FACT.** Published small-collection data contain identifier defects that a naive tool finds
   reliably and that a human can act on: duplicate catalogue numbers in 4 of 24 datasets (46
   values, none of them accidental row duplicates), rows with no catalogue number in 4 datasets.
2. **FACT.** Spreadsheet damage reaches published data: 1,983 date values in this sample are Excel
   serial numbers or mangled month abbreviations. This is corroborated in an adjacent field, where
   spreadsheet auto-conversion errors were found in 30.9% of genomics articles with supplementary
   gene lists, five years after the problem was publicised [5].
3. **FACT.** Date representation in real collection data is wildly heterogeneous: at least 11
   distinct syntaxes in 24 datasets, with only 53% of values in plain ISO form.
4. **FACT.** A conservative alias-based detector works on real Darwin Core files: an identifier
   column was identified in 22 of 24 datasets and no column was misidentified, with one
   column-order defect.
5. **FACT.** The validator's current signal-to-noise on real data is poor: about half of all
   reported values are false positives, essentially all of them in two date checks.
6. **INFERENCE.** The problems worth building for are identifiers and spreadsheet damage, not
   coordinates. Coordinates are both well covered by incumbents and empirically clean in
   published data.
7. **INFERENCE.** The defensible differentiator is the *constraint* (offline, no upload, works on
   any spreadsheet, before publication), not the check list.

## 12. What remains unknown

1. **OPEN QUESTION — the decisive one.** Would a collection manager act on these findings?
   Nothing in a public dataset can answer this.
2. **OPEN QUESTION.** How dirty is unpublished data? Every dataset we could obtain had already
   passed a publication step. The absence of coordinate errors is probably an artefact of that
   (§9.1).
3. **OPEN QUESTION.** Is the physical-custody/location hypothesis — the actual premise of Sample
   Operations — real? This study says nothing about it. It looked only at data hygiene. Note that
   `location`-style columns in these files are geographic, not storage locations; the storage
   question is not visible in published data at all.
4. **OPEN QUESTION.** Willingness to pay, at any price, by anyone. No public source addresses it.
5. **OPEN QUESTION.** Whether "runs offline without uploading" is a real constraint or a
   preference. Institutions already upload to the GBIF validator, so the constraint may be
   imaginary.
6. **OPEN QUESTION.** Whether a validation report is the right artefact at all, versus a fixer
   that repairs what it can and shows a diff.

**We have not shown, and this document must not be read as showing, that anyone wants this
tool.** Dataset defects are evidence about datasets.

## 13. Recommendation for the next phase

**Market/product validation: INSUFFICIENT EVIDENCE.** Conclusion unchanged from
[market-validation.md](../product/market-validation.md): no user contact, therefore no demand
evidence. Public datasets cannot close this gap, and no further dataset work will change it.

**Technical validation: PROCEED WITH CHANGES**, in this order and nothing else:

### FIX NOW

1. Fix the four date false positives (ISO ranges, unpadded ISO, dash-separated day-first, day ==
   month). Each is a small, testable change to `inspectDate`, and together they remove ~87% of the
   noise. Highest value per line of code in the whole backlog.
2. Prefer the primary alias over a `verbatim*` alias when both exist, regardless of column order.
   This fixes the IRKU Herbarium locality defect (§8).
3. Exclude the identifier column from the mixed-values check. Suffixes like `24793a` are normal;
   the warning is 100% noise on catalogue-number columns (§8.1).
4. Reword the completeness warnings to say where the information actually is
   (`verbatimEventDate`, `year`, `country`) instead of implying it is absent.
5. Suppress the ambiguous-date warning when day equals month (`04/04/2014`).

### ADD LATER

6. Report column-level facts once ("`locality` is empty in all 3,356 rows") instead of per row.
7. Name spreadsheet damage explicitly when a date column contains 4–5-digit numbers or
   `Mmm-YY` values. The pattern is narrow and the false-positive risk is low.

### DEFER

8. Whole-degree coordinate precision warning — needs a user to say whether it is useful; legitimate
   for old records.
9. Placeholder values for null (`s/n`, `?`, `not recorded`) — no stable meaning without the
   collection's own conventions.
10. Taxonomic name validity — high value but needs a name backbone (network call or bundled
    dataset), out of scope by design.
11. `accessionNumber` as an identifier alias — **OPEN QUESTION**: whether pre-publication
    spreadsheets use this as the primary identifier. Do not add without evidence from real
    spreadsheet exports.

### DO NOT BUILD

12. New coordinate checks beyond range and numeric format. Coordinates are well covered by GBIF,
    Symbiota, Specify and `bdc`, and empirically clean in published data (§9.1).
13. Taxonomic validation, Darwin Core implementation, any cloud dependency, any feature requiring
    a network call.
14. Anything in Sample Operations. The prototype stays throwaway.

**The gate does not move.** The FIX NOW and ADD LATER items are worth doing because they make the
artefact honest enough to hand to someone, not because the market question has advanced. The next
real evidence comes from a collection manager running this on a file we have never seen — ideally
an unpublished one, which is also the only way to answer §12.2.

---

## References

1. GBIF Data Validator — tool description and evaluation types.
   <https://www.gbif.org/tool/81281/gbif-data-validator>,
   <https://github.com/gbif/gbif-data-validator/blob/master/doc/evaluation_types.md>
2. Symbiota Collection Manager Guide, Data Cleaning tools (duplicate catalogue numbers,
   geographic cleaning, coordinate validator, taxonomic cleaning).
   <https://github.com/Symbiota/Symbiota-Documentation/blob/main/versioned_docs/version-3.4/Collection_Manager_Guide/Data_Cleaning/Data_Cleaning.md>
3. Specify 7 Uniqueness Rules and duplicate export.
   <https://discourse.specifysoftware.org/t/identifying-duplicates-for-merging-in-specify-7/3648>,
   <https://discourse.specifysoftware.org/t/configuring-uniqueness-rules/1487>
4. Ribeiro et al. (2022), *bdc: A toolkit for standardizing, integrating and cleaning
   biodiversity data*, Methods in Ecology and Evolution. <https://doi.org/10.1111/2041-210X.13868>,
   function reference <https://brunobrr.github.io/bdc/>
5. Abeysooriya et al. (2021), *Gene name errors: Lessons not learned*, PLOS Computational
   Biology. <https://doi.org/10.1371/journal.pcbi.1008984> (adjacent field; cited only as
   evidence that spreadsheet auto-conversion damage is real and persistent)
