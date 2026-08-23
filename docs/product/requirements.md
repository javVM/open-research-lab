# Requirements — Sample Operations

Status: Phase 0 (discovery). Last updated: 2026-08-23.
These requirements are proposals from desk research; they are subject to the Phase 2 user
validation described in [personas.md](personas.md).

Priority language: **MUST** = MVP (v0.1) blocker. **SHOULD** = MVP if cheap, else v0.2.
**LATER** = explicitly deferred. **NEVER** = out of product scope.

---

## 1. Scope of the MVP

The MVP exists to prove one thing: *a small group will use a local app instead of a
spreadsheet to track where their material is.* Anything that does not serve that proof is
deferred, however reasonable it sounds.

Single user, single machine, single database file, no network.

---

## 2. Functional requirements

### 2.1 Storage structure

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Create, rename and archive **containers** of configurable types (site, room, freezer, shelf, rack, drawer, cabinet, box, …), nested to arbitrary depth | MUST |
| FR-02 | Container types are data, not code — a user can add "Cabinet" or "Dewar" without a new release | MUST |
| FR-03 | A container may be declared **grid-capable** with rows × columns and labelling scheme (A1…H12, 1…81), generating addressable positions | MUST |
| FR-04 | Non-grid containers hold items without enumerated positions ("in drawer 3", unordered) | MUST |
| FR-05 | Display the full location path of any item and any container (`Lab A / Freezer 1 / Rack 2 / Box 7 / C04`) | MUST |
| FR-06 | Prevent moving a container into its own subtree (cycle) | MUST |
| FR-07 | Visual grid view of a box showing occupied/free positions | SHOULD |
| FR-08 | Capacity and occupancy summary per container | SHOULD |
| FR-09 | Container templates ("standard 9×9 cryobox") reusable on creation | LATER |
| FR-10 | Physical/temperature conditions per container (−80 °C, ambient) as metadata | SHOULD |

### 2.2 Items (samples and specimens)

| ID | Requirement | Priority |
|---|---|---|
| FR-20 | Create an item with: human-readable code, name/label, item type, optional description, optional storage position, arbitrary user-defined fields | MUST |
| FR-21 | Every item has an immutable internal identifier independent of any user-visible code | MUST |
| FR-22 | Human-readable codes are unique within the database and validated on entry | MUST |
| FR-23 | Optional automatic code generation from a configurable pattern (`PREFIX-{seq}`) | SHOULD |
| FR-24 | Item types are user-defined (DNA extract, tissue, fossil, herbarium sheet, culture) with per-type field definitions | SHOULD (types MUST; per-type fields SHOULD) |
| FR-25 | Record quantity/volume **with an explicit unit**; never store a bare number | MUST |
| FR-26 | Record collection/acquisition metadata: date, collector, locality text, optional lat/lon with an uncertainty or precision note | SHOULD |
| FR-27 | Mark an item consumed, destroyed, transferred out or lost — as a state transition, never a deletion | MUST |
| FR-28 | Split an item into aliquots/derived items with a recorded parent→child derivation | LATER (v0.2) |
| FR-29 | Attach files (photographs, chromatograms, field notes) to items | LATER (v0.3) |
| FR-30 | Taxonomic determination history (multiple identifications over time, with determiner and date) | LATER — required before claiming natural-history usefulness |

### 2.3 Movement and history

| ID | Requirement | Priority |
|---|---|---|
| FR-40 | Move an item to a different position or container, in one action | MUST |
| FR-41 | Every state-changing operation appends an immutable event: what, when, by whom, from → to, optional note | MUST |
| FR-42 | History is append-only; events cannot be edited or deleted through the UI | MUST |
| FR-43 | Full chronological history view per item | MUST |
| FR-44 | Occupied grid positions cannot receive a second item; the app refuses and explains | MUST |
| FR-45 | Move a whole container (with contents) and record it once at container level, with contents' paths following | MUST |
| FR-46 | Batch move of many selected items | SHOULD |
| FR-47 | Check-out / check-in (temporary removal for use, with expected return) | LATER (v0.2) |
| FR-48 | Loans and transfers to external institutions with due dates | LATER (v0.3) |
| FR-49 | Freeze/thaw cycle counting | LATER — only if users ask |
| FR-50 | Correcting a mistaken record produces a *correction event*, preserving the original value | MUST |

### 2.4 Search and retrieval

| ID | Requirement | Priority |
|---|---|---|
| FR-60 | Single search box matching code, name, type and location path, results under 200 ms on 50k items | MUST |
| FR-61 | Filter by item type, container subtree, status, date range | MUST |
| FR-62 | Browse the container tree and drill into any container's contents | MUST |
| FR-63 | Saved searches / filters | LATER |
| FR-64 | Search across user-defined fields | SHOULD |

### 2.5 Import and export

| ID | Requirement | Priority |
|---|---|---|
| FR-70 | CSV import with column mapping to fields, including user-defined fields | MUST |
| FR-71 | Import runs as a **dry run first**: full validation report (row, column, reason) with nothing written until confirmed | MUST |
| FR-72 | Import is transactional — all or nothing | MUST |
| FR-73 | Import can create missing containers implicitly, or refuse, at the user's choice | SHOULD |
| FR-74 | CSV export of items, containers and history, round-trippable with the importer | MUST |
| FR-75 | Export respects the current filter/selection | SHOULD |
| FR-76 | Excel (.xlsx) import | LATER — CSV first; users can save-as |
| FR-77 | Darwin Core Archive export for occurrence publication | LATER (v0.4), and only claimed once validated against GBIF's validator |
| FR-78 | MIxS / GGBN-aligned field templates for molecular samples | LATER |

### 2.6 Data ownership and integrity

| ID | Requirement | Priority |
|---|---|---|
| FR-80 | All data in one user-chosen SQLite file, openable with standard SQLite tooling | MUST |
| FR-81 | One-click backup copy of the database file, timestamped | MUST |
| FR-82 | Automatic schema migration on open, with a pre-migration backup and refusal to open files newer than the app | MUST |
| FR-83 | Multiple databases (switch/open recent), so a user can separate projects | SHOULD |
| FR-84 | Integrity check / repair command surfaced in the UI | SHOULD |
| FR-85 | Recorded actor (operator name) for attribution, set once per install, no authentication | MUST |
| FR-86 | Never delete rows for domain entities; archive instead | MUST |

### 2.7 Explicitly not in the MVP

Deferred: barcode/QR scanning and label printing (v0.2 — the most likely first
post-MVP demand); box grid visual editor; check-out/check-in; aliquots and derivation;
attachments; loans; taxonomy; Darwin Core export; xlsx; reporting/dashboards; saved searches;
audit export.

**NEVER** (out of product scope): user accounts and permissions in the local app; cloud sync
in the open-source app; ELN/protocols; analytical worksheets and CoAs; instrument
integration; ordering and consumables; billing; telemetry; plugin marketplace; mobile app.

Rationale for the hardest cuts:
- **Barcodes** are the single most requested feature in this category and still deferred,
  because scanning without a validated location model is a fast way to record wrong data
  quickly. Phase 2 interviews may promote this into the MVP; if P2/P3 say it is table stakes,
  we change the plan rather than defend it.
- **Aliquots/derivation** touch every part of the domain model. The model reserves room
  (FR-28) but the MVP does not implement it.
- **Multi-user** would force authentication, concurrency and conflict resolution — an
  entirely different product, and the reason our competitors need servers.

---

## 3. Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Time from download to first sample recorded | < 5 minutes, no account, no server, no config file |
| NFR-02 | Cold start of the application | < 3 s |
| NFR-03 | Search latency at 50,000 items | < 200 ms perceived |
| NFR-04 | Scale ceiling before redesign | 100,000 items, 1,000,000 events |
| NFR-05 | Works fully offline | no outbound network calls at all |
| NFR-06 | Platforms | Windows and macOS required; Linux expected |
| NFR-07 | Data durability | every write in a transaction; crash must not corrupt the file |
| NFR-08 | Auditability | every mutation attributable and timestamped (UTC stored, local displayed) |
| NFR-09 | Test coverage of domain invariants | 100% of documented invariants have tests |
| NFR-10 | Accessibility | keyboard-operable primary flows, visible focus, WCAG 2.1 AA colour contrast |
| NFR-11 | Language | English UI in MVP, all strings externalised for later Spanish translation |
| NFR-12 | Install footprint | single installer, no runtime prerequisites for the user |
| NFR-13 | Documentation | a first-run guide a researcher can follow without a developer |

---

## 4. Domain invariants (must be enforced, not merely documented)

1. A grid position holds at most one active item.
2. An item is in at most one location at a time.
3. Container parent relationships form a tree — no cycles, single parent.
4. Enumerated positions exist only within grid-capable containers, and only within declared
   dimensions.
5. Every location change of an item or container produces exactly one event.
6. Events are append-only and immutable.
7. An item's human-readable code is unique among active items.
8. A quantity without a unit is invalid.
9. A terminal state (destroyed, transferred out) forbids further movement, but never
   forbids reading history.
10. Archiving a container requires it to be empty of active items, or an explicit cascade
    that relocates or archives contents with events recorded.
11. Timestamps are stored in UTC with the originating offset preserved where known.
12. Imports either apply completely or not at all.

Each invariant maps to a test in the eventual test suite; see
[../architecture/testing-strategy.md](../architecture/testing-strategy.md).

---

## 5. Acceptance scenarios for v0.1

1. **Fresh start.** Download, open, create a database, create `Freezer 1 → Rack A → Box 3`
   (9×9), add sample `MB-0001` at C04. Total elapsed time under five minutes.
2. **Where is it?** Type `MB-0001` in search; the full path appears with the position, in one
   step.
3. **Move it.** Move `MB-0001` to Box 4 position A01; history shows both the creation and the
   move, with timestamp and operator.
4. **Refuse a collision.** Attempt to place another sample at Box 4 / A01; the app refuses
   with a clear message and offers the next free position.
5. **Import.** Import 500 rows from CSV where 7 rows have a bad container reference; the dry
   run lists exactly those 7 rows and nothing is written; after fixing, all 500 import in one
   transaction.
6. **Export and leave.** Export items and history to CSV, close the app, open the `.sqlite`
   file in an external SQLite browser and read the same data.
7. **Consume.** Mark a sample destroyed; it disappears from active searches, remains findable
   with status filter, still shows full history, and cannot be moved.
8. **Move a container.** Move Rack A to Freezer 2; all contained items report the new path;
   one container-level event is recorded.
9. **Survive an upgrade.** Open a v0.1 database with a later build: a backup is written
   automatically, migration runs, and data is intact.

---

## 6. Open questions requiring user input (Phase 2)

1. Is barcode scanning table stakes, or a v0.2 feature?
2. Is single-user acceptable given shared lab computers, or is concurrent access on a network
   drive the real requirement? (This is the highest-impact open question in the whole project —
   SQLite over a network share is not safe for concurrent write access.)
3. Does the database file end up in Dropbox/OneDrive/Google Drive? If so, corruption risk
   from sync must be actively managed and documented.
4. What are the real spreadsheet columns in use? Those are the schema we must import.
5. Which matters more first: laboratory freezer workflows (P1/P2) or collection cabinets and
   loans (P3)?
6. Is label printing needed before the tool is usable?
