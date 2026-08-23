# ADR-0009 — Recursive container tree instead of a fixed hierarchy

- Status: Proposed
- Date: 2026-08-23

## Context

The original brief describes laboratory storage as freezer → rack → box → position. That
matches a molecular lab and matches almost nothing else. Natural-history collections use
buildings, rooms, cabinets, drawers and jars; some labs use dewars, shelves, or plates; field
storage uses crates. Research into small collections shows storage arrangements vary widely
and are frequently reorganised.

Hard-coding a hierarchy would make the tool unusable outside one discipline — a failure mode
visible in narrow freezer-inventory tools.

## Decision

Model storage as a **single self-referencing `Container` tree** with a user-editable
`ContainerType` vocabulary. Any container may nest in any other (no type-pair rules in the
MVP). A container may optionally declare grid dimensions, in which case addressable
`Position` rows are materialised; non-grid containers hold items without coordinates.

## Alternatives considered

**Fixed `Freezer`/`Rack`/`Box` tables.** Rejected: cheap queries, but every new furniture type
is a schema migration and a release, and collections would have to lie about their storage.

**Fixed depth with generic names** (`level1`…`level4`). Rejected: arbitrary ceiling, unclear
semantics, and unusable UI labels.

**Materialised path string** (`/lab-a/freezer-1/rack-2/box-7`) as the primary structure.
Rejected as the source of truth: renames and moves require rewriting many rows, and integrity
depends on string manipulation. A recursive CTE gives paths on demand; a cached path column may
be added later purely as a search optimisation.

**Nested sets / closure table.** Rejected for the MVP: faster subtree queries, considerably
more write complexity, and unnecessary at our depth (typically 3–6 levels) with SQLite's
recursive CTE support.

**Type-transition rules** (a box may only sit in a rack). Deferred: it sounds like data
quality and behaves like an obstacle when a user puts a box on a shelf, which happens
constantly. Optional per-type hints may come later; hard rules probably never.

**Every container has a grid.** Rejected: it forces invented coordinates for drawers and
shelves, which pollutes the data with fiction.

## Consequences

- Positive: any discipline's storage is representable without a release; the same build serves a
  freezer lab and a fossil store; positions exist only where they are real.
- Negative: cycle prevention must be enforced on every move (a documented invariant with tests);
  path display requires a recursive query and caching; validation is looser, so the UI must make
  sensible structures easy rather than relying on the schema to forbid nonsense; grid resizing
  on a container with materialised positions and occupants needs a defined behaviour (open
  question, ADR required before v0.2).

## How we would know this was wrong

If users create malformed trees and get confused, add optional type hints and better defaults —
not a rigid hierarchy.
