# Testing strategy — Sample Operations

Status: Phase 0 (proposal). Last updated: 2026-08-23.
No code exists yet, so no tests exist yet. This document defines what will be required from
Phase 1 onward and is binding on future work.

---

## 1. Principle

The product's promise is that data is never silently lost or corrupted. That promise is only
credible if the invariants are executable. Therefore: **every documented domain invariant has
at least one test, and a PR that adds a rule without a test is incomplete.**

Tests are not modified to make them pass. If a test is wrong, that is a separate change with
its own justification.

---

## 2. Levels

### 2.1 Domain unit tests (`packages/core`) — the bulk of the suite

Pure, fast, no I/O, no database, no Electron. In-memory fakes for ports (`Clock`, `IdGen`,
repositories). These tests encode the science and business rules:

- position occupancy, capacity and label generation;
- container tree operations, including cycle rejection;
- status transitions, including that terminal states forbid movement;
- quantity/unit validation (a value without a unit is invalid);
- code uniqueness among active items;
- event emission — every mutation produces exactly one event with correct from/to;
- correction semantics (append, never overwrite).

### 2.2 Application/use-case tests (`packages/core/application`)

Each use case tested through its public interface with fake ports: happy path, every documented
failure, and the resulting event stream. Failures are asserted as returned error values, not
exceptions.

### 2.3 Persistence integration tests (`packages/persistence-sqlite`)

Against a **real SQLite file** in a temporary directory — never a mock, since the point is to
verify SQL and constraints:

- every repository method round-trips;
- database constraints actually fire: duplicate active code, double occupancy of a position,
  foreign-key violation, enum check violation, `UPDATE`/`DELETE` on `events` rejected by
  trigger;
- transaction rollback leaves no partial state (including no orphan event rows);
- recursive CTE path queries return correct paths at depth;
- read-only open when the file is already locked by another instance.

### 2.4 Migration tests

For every migration: apply it to a fixture database populated with realistic data from the
previous version, assert the data survives semantically, and assert the pre-migration backup
was written. Also assert the app refuses a database whose schema version is newer than the
build. A migration without a test is not merged.

### 2.5 Import/export tests

- CSV import: column mapping, dry-run validation report content (row, column, reason),
  all-or-nothing transactionality, duplicate handling, implicit container creation on and off;
- malformed input: wrong encoding, BOM, CRLF, quoted commas, missing required columns, extra
  columns, blank rows, Excel-mangled dates and numbers stored as text;
- round-trip: export → import into an empty database → export again produces equivalent data
  (this is the anti-lock-in guarantee, tested);
- unit and verbatim-value preservation: no silent normalisation, no lost precision.

### 2.6 IPC contract tests (`apps/desktop`)

Every channel validates its payload with `zod` and rejects malformed input; the renderer cannot
reach a use case with unvalidated data; result unions serialise correctly across the boundary.

### 2.7 End-to-end tests (Playwright on Electron, from Phase 4)

Deliberately few and high-value — the nine acceptance scenarios in
[../product/requirements.md](../product/requirements.md#5-acceptance-scenarios-for-v01):
first-run setup, create structure, add sample, find it, move it, refuse a collision, import with
errors then success, export, mark destroyed, move a container, and open-after-upgrade.

### 2.8 Performance tests

A generated 50,000-item / 500,000-event database as a fixture. Assert search, list and path
queries stay within the targets in the requirements. Run in CI so regressions are caught by us,
not by users.

---

## 3. What we do not test

- Framework behaviour (Angular's forms, SQLite's own correctness).
- Getters, DTO shapes, or trivial pass-throughs, purely to raise a coverage number.
- Third-party library internals.

Coverage is a diagnostic, not a target. The binding metric is: **100% of documented invariants
covered.** A coverage percentage is reported but not gated, because gating it reliably produces
tests written for the metric rather than the risk.

---

## 4. Test data

Realistic fixtures for both communities — a molecular lab (freezers, racks, 9×9 cryoboxes, µL
volumes) and a paleontology collection (cabinets, drawers, no grids, imprecise historical
dates). Deterministic: fixed clock, seeded id generation, no randomness without a seed, no
network, no reliance on the host locale or timezone. Timezone handling is tested explicitly with
a non-UTC host timezone, because UTC-only CI hides an entire class of date bugs.

---

## 5. CI

GitHub Actions on every PR: install → lint → typecheck → unit → integration → migration →
import/export → performance smoke. E2E on Linux for every PR once it exists, and on Windows and
macOS before a release. Native-module builds exercised on all three platforms from Phase 1, so
packaging breaks surface early rather than at release.

Required to merge: all checks green. No skipped tests without a linked issue and a comment
explaining why.

---

## 6. Definition of done for a feature PR

1. Domain rules implemented in `core` with unit tests.
2. Persistence changes covered by integration tests against a real database file.
3. A migration with its own test, if the schema changed.
4. Events emitted for every mutation, asserted in tests.
5. Import/export updated and round-trip tested, if the data model changed.
6. Lint, typecheck and the full suite green locally and in CI.
7. Documentation updated — including an ADR if a structural decision changed.
8. No new dependency without justification in the PR description.
