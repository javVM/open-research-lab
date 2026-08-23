# ADR-0002 — SQLite as the datastore

- Status: Proposed
- Date: 2026-08-23

## Context

Sample Operations must work offline on a researcher's own machine, with no server, no
administrator and no infrastructure cost. Data must be portable, inspectable and owned by the
user. The domain is strongly relational: a container tree, positions, items, an append-only
event log, and typed field values. Integrity matters more than throughput — the whole product
promise is that nothing is silently lost. Expected scale is thousands to low hundreds of
thousands of items, single writer.

The brief explicitly warns against choosing MongoDB out of familiarity, and requires that
SQLite, PostgreSQL and MongoDB each be evaluated.

## Decision

Use **SQLite** as the sole datastore, accessed through `better-sqlite3` from the Electron main
process. One database file per project, at a path the user chooses. `WAL` journal mode,
`foreign_keys=ON`, and every use case wrapped in a transaction.

## Alternatives considered

**PostgreSQL.** Technically excellent and the right answer for a multi-user server product.
Rejected for the MVP because it requires installing and running a server (or bundling and
supervising one), which breaks the five-minute, no-infrastructure onboarding target and puts
us in the same position as OpenSpecimen, Specify and SENAITE — precisely the gap we are trying
to fill. It also destroys the "your data is one file you can copy" property. Reconsider only
if a self-hosted multi-user deployment mode is built; the repository-port abstraction keeps
that door open.

**MongoDB.** Rejected. Our data is relational, and the integrity guarantees we most need are
exactly the ones a document store does not give us cheaply: foreign keys, a unique constraint
on position occupancy, and a check-constrained enum. Enforcing "one item per position" and
"no cycles in the container tree" in application code alone is how data corruption happens.
It also requires a server, so it fails the same test as PostgreSQL, with fewer benefits for
this shape of data.

**Plain JSON or CSV files on disk.** Rejected: no transactions, no constraints, no indexed
search, and whole-file rewrites risk data loss on crash. Ironically closer to the spreadsheet
problem we are replacing.

**DuckDB.** Interesting for analytics, wrong for transactional record-keeping with many small
writes.

**IndexedDB in the renderer.** Rejected: the data would be hidden inside an application
profile directory instead of being a file the user owns, which contradicts the core promise.

## Consequences

- Positive: zero setup; a single portable file; real transactions and constraints; excellent
  read performance at our scale; the file is readable with ubiquitous tooling (SQLite browser,
  Python, R), which is our anti-lock-in guarantee; SQLite's format is a recommended long-term
  archival format, which matters for scientific records.
- Negative: one writer at a time — no concurrent multi-user access. Unsafe over network
  shares. Cloud-sync folders can corrupt an open database, so we must detect and warn. Weaker
  native typing than PostgreSQL, so check constraints and application validation must be
  explicit. `better-sqlite3` is a native module, adding rebuild/CI cost.
- We will write hand-written SQL against it (ADR-0005) and keep repository ports in the domain
  so a PostgreSQL implementation is possible later without touching domain logic.

## How we would know this was wrong

If Phase 2 interviews show that concurrent multi-user access on a shared network drive is a
hard requirement rather than a nice-to-have, SQLite-on-the-desktop stops being sufficient. The
answer then is an additional server deployment mode, not abandoning SQLite for the local app.
