# Sample Operations throwaway slice (v0.1)

Experimental, disposable prototype. It is **not** the product Sample Operations
and it does **not** validate the market hypothesis.

It asks one technical question: **can we import only enough of a collection
CSV to identify physical objects, then create a storage hierarchy and answer
"where is X now?" and "what happened to X?"?**

The import philosophy is deliberately asymmetric:

> **Import enough to start physical tracking, not enough to recreate the catalogue.**

A source collection may contain many scientific columns. This slice cares only
about:

- a catalogue number / external id (required)
- an optional label / name
- an optional verbatim physical location column such as `StorageLocation`,
  `CurrentLocation` or `Storage`

Everything else is ignored. The existing catalogue remains the source of truth
for scientific data. This tool owns only the physical tracking state it records:
current location, current status and movement/custody history.

No UI, no product database, no shared packages, and no final architecture. The
JSON export used for the round-trip test is throwaway persistence, not a
database. If the experiment is useful, the learnings will inform the real
product; if not, this code is deleted.

## Running

Requires Node.js 20.11 or newer.

```bash
cd tools/sample-operations-slice
npm install
npm run typecheck
npm test
```
