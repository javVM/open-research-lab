# ADR-0013 — Malleable orthogonal outlines for mappable locations in the physical-location-prototype

- Status: Proposed
- Date: 2026-08-28

## Context

The `tools/physical-location-prototype` floor-plan map draws mappable locations (floors, rooms,
cabinets) as axis-aligned rectangles defined by `x`/`y`/`width`/`height`. A real collection space
is frequently not rectangular — a room can be L-shaped, a cupboard can sit in a notch, a floor can
wrap a stairwell — but the prototype could only represent rectangles. During UI validation the
spatial view was praised, but "rooms are always boxes" was called out as unrealistic.

The shape must stay "maleable" (mouldable) while remaining physically plausible: interior angles
of 90°, no diagonals, no curves. The user explicitly ruled out triangles and rounded shapes; only
orthogonal (rectilinear) polygons are wanted.

## Decision

Add an optional `outline: Point[]` to `Location` — a closed, clockwise sequence of vertices in the
location's local coordinates (`0..width`, `0..height`). When absent the location is a plain
rectangle. The outline is persisted automatically because the `DatasetStore` snapshots the whole
dataset to `localStorage` as JSON; no schema migration is needed for a prototype whose snapshots
are throwaway demo state.

- **Rendering**: the 2D map clips each shaped rect with `clip-path: polygon(...)`. Repositioning
  (drag) still moves `x`/`y`; resizing rescales the outline in proportion (`scaleOutline`).
- **Editing**: a "Shape" mode in the map toolbar. Clicking a location on the map targets it and
  reveals vertex handles (drag to slide the two incident edges) and edge-midpoint handles (drag
  inward to cut a rectangular notch — drag toward a corner for an L, the middle for a U). A
  "Reset" action reverts the targeted location to a rectangle. Editing is desktop-only, matching
  reposition/resize. When a shape change (or resize) leaves a child location straddling or outside
  the parent's outline, the child is pulled back to the nearest position that fits inside
  (`nearestInsidePosition`), so the parent's structure constrains its children. The on-map label
  is re-anchored to a point inside the outline (`labelAnchor`) instead of staying at the clipped
  corner.
- **3D**: `floor-plan-3d` extrudes the same outline: the roof is clipped with the polygon and one
  vertical wall is drawn per edge, so an L-shaped room reads as an L in 3D too. Shaped locations
  do not get the drawer-shelf overlay (that overlay is specific to the four rectangular sides);
  the outline is scaled to the footprint the 3D view uses (rooms/cabinets at 1:1, floors to the
  shared `FLOOR_FOOTPRINT`).
- **Geometry**: the edit operations live in pure, framework-free `core/outline.ts`
  (`moveVertex`, `notchEdge`, `inwardNormal`, `simplifyOutline`, `scaleOutline`) with unit tests,
  so the orthogonality invariant and the notch/vertex rules are enforced and verifiable
  independently of the UI.

The orthogonality constraint is preserved by construction: every editing primitive only ever moves
vertices along their incident axis-aligned edges, and `notchEdge` inserts corners offset
perpendicular to a straight edge. There is no code path that can produce a diagonal.

## Alternatives considered

- **Predefined shape presets (rectangle, L, T, U).** Rejected: the ask was for free malleability,
  not a fixed catalogue. Presets would also not compose into stairs, wraps and arbitrary notches.
- **A set of rectangle "cells" glued together (polyomino).** Rejected: it duplicates the model
  (a location would need both a bounding box and a cell list) and makes "how do I render this in
  3D or compute occupancy" harder, for no gain over a single polygon outline.
- **Free vertex dragging with no orthogonality constraint.** Rejected: it would allow diagonals
  and triangles, which the user explicitly ruled out, and complicate the 3D extrusion and hit
  testing.
- **3D extrusion via one wall per edge.** Accepted, replacing the earlier bounding-box shortcut:
  because the outline is orthogonal, each edge is axis-aligned and becomes a single vertical
  wall (a `rotateX`/`rotateY` face), so the same polygon data drives both the 2D clip and the 3D
  shell.

## Consequences

- The data model gains one optional field; every consumer that only reads `x`/`y`/`width`/`height`
  (preview overlays, bounds) keeps working unchanged because the outline shares that bounding
  box.
- Shape editing adds one toolbar mode and a handful of drag handles; the interaction is
  desktop-only, consistent with the existing reposition/resize affordances.
- The 3D view shows shaped rooms as extruded polygons (clipped roof + one wall per edge). The
  drawer-shelf overlay is only rendered for plain rectangles, since it assumes four sides.
- `core/outline.ts` is the single source of truth for the orthogonal-polygon rules, so any future
  consumer (e.g. import/export or a second product) reuses the same invariants.

## How we would know this was wrong

If users expect diagonal or curved walls (real walls are rarely a perfect grid either), or if
resizing a shape misbehaves because the outline and the bounding box drift apart, the outline model
or the scale-on-resize rule should be revisited. If the per-edge 3D walls read as too thin or the
shaped rooms look hollow, the wall rendering (thickness, a bottom face, or the shelf overlay for
non-rectangular shapes) should be revisited. When the prototype is extracted to a product
repository, `outline` should be reviewed against the real domain model and, if it survives,
promoted from prototype metadata to a first-class field.
