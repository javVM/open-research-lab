# ADR-0006 — Two-layer identifiers: ULID plus human codes

- Status: Proposed
- Date: 2026-08-23

## Context

Scientific practice depends on human-readable identifiers written on tubes, labels and in
notebooks (`MB-0001`, `PAL-2024-0187`). Those codes get renumbered, re-prefixed and corrected.
Meanwhile, records must be referenceable stably forever — history, derivation lineage and
future exports must not break when a label changes. Guidance on persistent identifiers in
collections (ARK best practices) is explicit that identifiers should be opaque and stable
rather than semantically loaded.

## Decision

Two layers:

1. **Internal identity:** a ULID assigned at creation, immutable, never shown as the primary
   user-facing identifier, used for all foreign keys and all history references.
2. **Human code:** a user-owned `code` field, unique among active records, editable — and every
   change appends a `renamed` event so the old label remains discoverable.

Optional pattern-based code generation (`PREFIX-{seq:0000}`) is a convenience, never a
requirement.

## Alternatives considered

**Auto-increment integers as the only identifier.** Rejected: they leak record counts, collide
when merging two databases, and are meaningless on a label.

**UUIDv4.** Functionally fine; ULID chosen because it sorts lexicographically by creation time,
which makes ordered listings and debugging easier, and is more compact in text.

**Human code as the primary key.** Rejected outright: a re-label would cascade through every
event and lineage row, and duplicate labels during a messy import would be unrepresentable.
This is the single most common data-integrity mistake in spreadsheet-derived systems.

**Composite natural keys** (institution + collection + catalog number). Rejected as identity;
may be added later as a uniqueness constraint for Darwin Core export.

**Globally resolvable persistent identifiers (ARK, DOI) minted by us.** Rejected for the MVP:
minting resolvable identifiers implies a resolver service and an institutional commitment we
cannot honour offline. The ULID/code separation is designed so an ARK or catalog number can be
attached later without changing identity.

## Consequences

- Positive: labels can be corrected without data loss; history and lineage never dangle;
  databases can be merged without primary-key collisions; export can carry both layers.
- Negative: two identifiers to explain in the UI (mitigated by showing `code` almost everywhere
  and treating the ULID as plumbing); uniqueness of `code` must be enforced with a partial
  index scoped to active records, and imports must handle duplicates explicitly rather than
  silently.

## How we would know this was wrong

If users are confused by seeing internal ids, hide them further. If collections need a
resolvable persistent identifier before v1.0, add it as an additional attribute — the model
already anticipates that.
