# Architecture decision records

Each ADR records one significant decision, the alternatives considered, and why they were
rejected. ADRs are immutable once accepted: if a decision changes, add a new ADR that
supersedes the old one and mark the old one `Superseded by ADR-XXXX`. Never quietly delete or
rewrite a decision.

Statuses: `Proposed` (Phase 0 — argued but not yet validated by implementation),
`Accepted`, `Superseded`, `Rejected`.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-sqlite-as-the-datastore.md) | SQLite as the datastore | Proposed |
| [0003](0003-electron-desktop-shell.md) | Electron as the desktop shell | Proposed |
| [0004](0004-angular-for-the-ui.md) | Angular for the UI | Proposed |
| [0005](0005-no-orm-hand-written-sql.md) | No ORM; hand-written SQL in repositories | Proposed |
| [0006](0006-identifiers.md) | Two-layer identifiers: ULID plus human codes | Proposed |
| [0007](0007-append-only-event-history.md) | Append-only event history, not event sourcing | Proposed |
| [0008](0008-modular-monolith-monorepo.md) | Modular monolith in a product-scoped monorepo | Proposed |
| [0009](0009-recursive-container-tree.md) | Recursive container tree instead of a fixed hierarchy | Proposed |
| [0010](0010-single-user-mvp.md) | Single-user MVP with no authentication | Proposed |
| [0011](0011-angular-material-for-ui-components.md) | Angular Material for UI components in the physical-location-prototype | Proposed |
| [0012](0012-signals-and-bundle-budget-in-prototype.md) | Signal inputs and bundle budget in the physical-location-prototype | Proposed |
| [0013](0013-malleable-orthogonal-outlines-in-prototype.md) | Malleable orthogonal outlines for mappable locations in the physical-location-prototype | Proposed |
| [0014](0014-evolving-product-incubation.md) | Evolving product incubation inside the umbrella repository | Accepted |
