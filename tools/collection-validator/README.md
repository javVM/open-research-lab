# Collection data check (`collection-validator`)

**Experimental prototype — an Open Research Lab experiment, not a product.**

Point it at a CSV exported from your spreadsheet or collection management system. It reads the
file, looks for problems a person should probably look at, and prints a report. It never changes
your file, never connects to the internet, and never sends your data anywhere.

It exists to answer one question: **is this kind of check actually useful to a small collection?**
If it catches things you care about, we will build more of it. If it does not, we will throw it
away. Either answer is useful, so please tell us which one it is.

---

## What it checks

| Check | Severity |
| --- | --- |
| Two or more rows share the same catalogue/specimen number | ERROR |
| A row has no catalogue/specimen number at all | ERROR |
| A latitude outside −90…90, or a longitude outside −180…180 | ERROR |
| A coordinate that is not a number | ERROR |
| A date that cannot exist (e.g. `1989-02-31`) | ERROR |
| A row with more or fewer values than there are columns | ERROR |
| The same column heading used twice | ERROR |
| A date written so it could be read two ways (`03/04/1998`) | WARNING |
| A date in a format we could not read (`summer 1976`) | WARNING |
| A date in the future | WARNING |
| A row with no date, or no locality | WARNING |
| Coordinates written as degrees and minutes instead of decimals | WARNING |
| Only one half of a coordinate pair, or coordinates of exactly `0, 0` | WARNING |
| Completely empty rows, and rows that are exact copies of an earlier row | WARNING |
| A column that holds a number in almost every row and something else in a few | WARNING |
| A column heading that is blank, or padded with extra spaces | WARNING |
| No column looked like a catalogue number, so identifiers were not checked | WARNING |

**ERROR** means something is definitely wrong or impossible. **WARNING** means it looks
suspicious and only you can judge — for example, a missing locality may be entirely correct for
your material. When in doubt the tool warns rather than accuses.

## What it deliberately does *not* do

- It does **not** check Darwin Core, GBIF or any other standard, and reports nothing about
  standards conformance. "No errors" means "none of the checks above fired" — nothing more.
- It does **not** validate taxonomy, spelling, geography, units, or whether the coordinates fall
  where the locality says they do.
- It does **not** understand arbitrary schemas. Columns it does not recognise are listed and left
  alone, never guessed at.
- It does **not** change, normalise, reformat or rewrite your data. There is no import, no
  database, no storage and no account.
- It does **not** phone home. There is no network access, no telemetry and no analytics.

## Running it

Requires [Node.js](https://nodejs.org) 20.11 or newer. Nothing else.

```bash
cd tools/collection-validator
npm install                                   # installs 3 development tools, offline afterwards
npm run validate -- /path/to/specimens.csv
```

Options:

| Option | Meaning |
| --- | --- |
| `--delimiter <char>` | Column separator: `,` `;` `\|` or the word `tab`. Guessed from the file if omitted. |
| `--json [path]` | Also write a machine-readable JSON report (to the screen if no path is given). |
| `--quiet` | With `--json`, print only the JSON. |
| `-h`, `--help` | Show usage. |

Exit codes: `0` no errors, `1` errors found, `2` the file could not be read or understood.
Warnings on their own do not fail.

### Example

```bash
npm run validate -- fixtures/duplicate-identifiers.csv
```

```text
Collection data check
=====================

File:    fixtures/duplicate-identifiers.csv
Rows:    7 (not counting the heading row)
Columns: 3, separated by comma

Columns we recognised
---------------------
  catalogue number  ->  "CatalogNumber"
                        because the column heading "CatalogNumber" is a name we recognise for catalogue number
  locality          ->  "Locality"
                        because the column heading "Locality" is a name we recognise for locality
  date collected    ->  "EventDate"
                        because the column heading "EventDate" is a name we recognise for date collected

  Records are identified by "CatalogNumber".

What we found
-------------
  ERROR    1 row has no catalogue number ("CatalogNumber")
  ERROR    2 catalogue numbers are used by more than one row (2 repeated rows)
  WARNING  1 row is an exact copy of an earlier row

Details
-------
  ERROR    1 row has no catalogue number ("CatalogNumber")
          A record with no identifier cannot be matched to the physical object or to any other list.
            line 7

  ERROR    2 catalogue numbers are used by more than one row (2 repeated rows)
          Two objects sharing a number, or the same object entered twice. Both are worth checking by hand.
            "ABC-001" on line 2 and line 4
            "ABC-002" on line 3 and line 6

  WARNING  1 row is an exact copy of an earlier row
          Every value is identical, including the identifier. Often a copy-and-paste or a double import.
            line 4 repeats line 2

Summary
-------
  errors:   2   (definitely wrong, or impossible)
  warnings: 1   (suspicious — only you can judge)

This is an experimental tool. It has not changed your file, and it does not claim your
data is correct or that it meets any published standard.
```

## Column headings it recognises

Matching is deliberately literal: a heading is recognised only when it exactly matches one of the
names below, ignoring case, spaces and punctuation (`Catalog No`, `catalog_no` and `catalogno` are
all the same). Nothing is inferred from the contents of a column, and the report always says which
heading it used and why.

| Meaning | Recognised headings |
| --- | --- |
| catalogue number | catalog number, catalogue number, catalog no, catalogue no, catalog nr, catalog id, catalogue id, cat no, specimen number, specimen no, specimen id, specimen code |
| occurrence ID | occurrence id, occurrence identifier, occ id, occurrence key |
| locality | locality, locality name, location, location name, site, site name, verbatim locality, locality description |
| latitude | latitude, decimal latitude, lat, lat decimal, latitude decimal, dec latitude, decimal lat |
| longitude | longitude, decimal longitude, lon, lng, long, lon decimal, longitude decimal, dec longitude, decimal long |
| date collected | event date, date, collected date, date collected, collection date, date of collection, verbatim event date, collecting date |
| collector | collector, collectors, collector name, collected by, recorded by, recorded by id, collector list, leg |

The catalogue number is used as the record identifier; if there is none, the occurrence ID is used.
If several columns match the same meaning, the tool checks the first and says so rather than
silently picking one. Headings are English only for now.

**If your headings are not in this list, that is exactly the feedback we want** — tell us the
heading and we will add it.

## Development

```bash
npm test        # unit and command-line tests (Node's built-in test runner)
npm run typecheck
```

Fixtures under `fixtures/` are small, hand-written files, each exercising one situation. The
checking logic (`src/csv.ts`, `src/detection.ts`, `src/validation.ts`, `src/report.ts`) has no
dependencies and knows nothing about the command line, so it could later become a library — but no
abstraction has been extracted for that yet, on purpose.

## Status

Prototype, version 0.0.1, no compatibility promises. It is small enough to be discarded once we
know whether it is useful. See [`docs/product/user-validation.md`](../../docs/product/user-validation.md)
for how the feedback will be used.
