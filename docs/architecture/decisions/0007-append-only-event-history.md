# ADR-0007 — Append-only event history, not event sourcing

- Status: Proposed
- Date: 2026-08-23

## Context

The product's second core question is "what happened to sample X?". Spreadsheets answer it
badly because they store only current state. History must therefore be complete, attributable
and tamper-resistant. At the same time, search and listing must be fast at 50k+ items, and the
system must stay simple enough for one maintainer.

There is a real design fork: store events as the source of truth and derive state (event
sourcing), or store state and append an audit log alongside it.

## Decision

Store current state directly on entities, and append an immutable `Event` row for every
mutation **inside the same transaction**. Events are the authoritative record of *what
happened*; entity rows are the authoritative record of *what is*. `UPDATE` and `DELETE` on the
events table are blocked by database triggers. Corrections append a `corrected` event
preserving the previous value; nothing is rewritten. Bulk operations share a `batchId` so an
import or batch move reads as one action.

Scientific lineage (aliquots, extractions, pooling) is modelled separately as
`DerivationLink`, not inferred from the event log.

## Alternatives considered

**Full event sourcing** (state rebuilt by replaying events). Rejected: it adds projections,
replay, versioned event schemas and snapshotting — substantial complexity whose payoff
(temporal queries, rebuildable state) we get most of from an append-only log, in a single-user
desktop app with one writer. It would also make simple queries hard, which is our performance
requirement.

**Audit via database triggers writing a generic shadow table.** Rejected: triggers cannot know
the operator's intent (a *move* versus a *correction*), and intent is exactly what makes the
history useful to a researcher rather than a diff.

**No history; just `updatedAt` and `updatedBy`.** Rejected: this is the spreadsheet failure
mode and the product would have no reason to exist.

**Soft-delete flags only.** Rejected as insufficient: knowing something is gone is not knowing
what happened to it.

**Conflating lineage with the audit log** (a `derived` event only). Rejected: pooling is
many-to-one, lineage must be traversable without scanning the log, and mixing custody with
science makes both harder to reason about. Both are recorded — an event for the audit trail
and a link for the graph.

## Consequences

- Positive: complete, attributable history at low complexity; fast current-state queries; a
  natural export for audit purposes; corrections are transparent rather than destructive.
- Negative: state and log can theoretically diverge through a bug — mitigated by writing both
  in one transaction and by an integrity-check command that recomputes derived location from
  events and reports mismatches. The events table grows monotonically (a million rows is
  nothing for SQLite; document the ceiling and revisit if it is ever approached).
- Container moves are recorded once at container level rather than fanning out to every
  contained item, because location paths are computed from the tree. A freezer reorganisation
  must not write ten thousand rows.

## How we would know this was wrong

If users routinely need "show me the state of the collection as of last March", we would need
projections closer to event sourcing. Watch for that request; do not pre-build for it.
