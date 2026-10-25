# Physical Location Prototype → Sample Operations

**Evolving prototype — not the final product yet and not a Phase 2 GO decision.**
See [`AGENTS.md`](../../AGENTS.md) for the governance rules this repository operates under.

## What this is

An **npm workspace** realising the modular-monolith layout from ADR-0008 inside the incubator
(ADR-0014). It is the incubating home of the candidate **Sample Operations** product and will be
extracted to a standalone repository when the criteria in ADR-0014 are met.

```
packages/core               pure domain model + invariants (no I/O, no framework)
packages/persistence-sqlite SQLite schema, migrations, repositories (ADR-0002, ADR-0005)
apps/cli                    the import/validate/export pipeline — a thin, headless CLI
apps/ui                     the Angular spatial UI prototype
```

**Honest asymmetry:** `apps/ui` still runs on its own *simplified* domain model
(`apps/ui/src/core`) with `localStorage` persistence. It is **not yet wired** to `packages/core`
or `packages/persistence-sqlite`. The real domain core and SQLite persistence are what the CLI
uses today; the UI will be migrated to them in a later phase. Nothing in `apps/ui/src/core` is a
preview of `packages/core` or an architecture precedent.

## The pipeline (`apps/cli`)

The first shippable slice (market-validation §8, roadmap Phase 4): it delivers value before a
collection commits to anything, by validating and migrating a spreadsheet or CMS export.

```
node apps/cli/dist/index.js init <db>                                     create + seed a database
node apps/cli/dist/index.js validate <csv> [--mapping <json>]             dry-run report, no database
node apps/cli/dist/index.js import <csv> --db <db> [--mapping <json>]     dry-run then apply, all-or-nothing
node apps/cli/dist/index.js export --db <db> [--out <csv>]                round-trips back through import
```

- `validate` reports `row, column, reason` in plain language and never writes anything.
- `import` validates first; if anything is wrong it writes nothing (transactional, FR-72).
- The CSV maps headers onto canonical fields; a `--mapping` JSON can remap a Symbiota/Specify-style
  export (`{"catalogNumber": "code", ...}`).
- Containers are created implicitly from a `containerPath` such as `Store 2 / Cabinet 4 / Drawer 12`;
  a grid `containerType` (e.g. `Box`) plus a `position` (`C4` or `C04`) place an item in a cell.
- Every imported item appends an `imported` event in the same transaction (ADR-0007).

## Domain model and invariants

`packages/core` is the *real* model from `docs/architecture/domain-model.md`: `Container` →
`Position` → `Item`, ULID identifiers (ADR-0006), quantities with units, partial dates, and an
append-only event log. The documented invariants in `docs/product/requirements.md` §4 are enforced
in core (pure predicates) and, where SQLite can express them, as database constraints (partial
unique indexes, check constraints, append-only triggers) in `packages/persistence-sqlite`.

## The UI prototype (`apps/ui`)

An Angular 22 prototype (standalone components, signal forms, zoneless) exploring whether a
spatial/visual representation of physical location is easier to understand than a flat list. It has
its own synthetic, deterministic demo dataset (`apps/ui/src/core/seed.ts`) and is not
user-validated. Its domain model is a deliberate simplification (a `position` is a leaf `Location`;
no units, no ULIDs, no `ItemType`), and persistence is `localStorage`.

Stack: Angular 22, Angular CDK `drag-drop`, Angular Material, Jest + `jest-preset-angular`, a
lightweight custom i18n layer (English/Spanish, runtime-switchable) backed by local XLIFF files.
No backend; the only network calls fetch the two static translation files.

Features:

- **Location tree / spatial view / item detail** three-pane layout, with search-to-navigate.
- **Hierarchy**: building → floor → room → cabinet → drawer → (optionally) box → tray → position.
- **Floor plan**: Map/List toggle; draggable, resizable rectangles for mappable locations with
  occupancy-tinted backgrounds; **malleable 90°-only shapes** (orthogonal outlines, ADR-0013);
  optional floor-plan image import as a visual backdrop.
- **3D view**: the same coordinates extruded as CSS/Three boxes, read-only orbit/zoom.
- **Move flow**: drag-and-drop within a view, or click any destination to confirm a move across
  views; every move is recorded in the item's history.
- **Alarms**: non-dismissable notifications derived from state (an item checked out past its due
  time).
- **Reports**: read-only analytics computed live from the demo dataset.
- **QR/barcode**: camera scanner (QR, Data Matrix, Code 128, Code 39, EAN-13) and local label
  generation (QR, Data Matrix, Code 128), with the heavier `bwip-js` lazy-loaded.

See `apps/ui/README.md` if that directory ever gets its own README; for now this file documents it.

## Commands

```bash
npm install
npm run verify      # build (in dependency order) + test + typecheck
npm test            # all workspaces
npm run build       # core → persistence-sqlite → cli → ui
npm start           # serve the Angular UI prototype (http://localhost:4200)
```

## Testing

`npm test` runs the full suite: `packages/core` (Vitest, pure domain logic), 
`packages/persistence-sqlite` (Vitest, against a real temporary SQLite file — never a mock),
`apps/cli` (Vitest, CSV parsing, validation, import/export round-trip), and `apps/ui` (Jest,
Angular components). Every documented invariant has at least one test.
