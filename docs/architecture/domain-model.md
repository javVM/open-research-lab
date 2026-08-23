# Domain model — Sample Operations

Status: Phase 0 (proposal). Last updated: 2026-08-23.

This is a proposal, not an implemented schema. It is deliberately smaller than the domain
models of OpenSpecimen or Specify: it models **physical custody** well and leaves scientific
metadata extensible. Rationale in [../research/domain-research.md](../research/domain-research.md).

---

## 1. Design decisions that shape the model

1. **One recursive container tree, not a fixed freezer→rack→box hierarchy.** Users' furniture
   differs (freezers, cabinets, drawers, dewars, shelves, field boxes). A fixed hierarchy is
   the most common way this kind of tool becomes unusable outside the lab it was written for.
2. **Grid positions only where grids exist.** A cryobox has A1–H12; a drawer does not. Making
   positions optional avoids inventing fake coordinates.
3. **The item is the physical thing.** Scientific interpretation (taxon, protocol, subject)
   sits beside it, not inside its identity.
4. **History is an append-only event log, and it is the source of truth for "what happened".**
   Current location is derived state, stored denormalised for query speed.
5. **Derivation lineage is a separate concept from audit history.** "This aliquot came from
   that tube" is science; "this tube moved on Tuesday" is custody. Conflating them is a
   documented mistake in this domain.
6. **Nothing is deleted.** Archive and terminal states instead.
7. **Two identifier layers:** an opaque immutable internal id, plus a human-readable code the
   user owns and may change (with the change recorded).

---

## 2. Entities

### 2.1 `Container`

A physical space that can contain other containers and/or items.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | immutable, internal |
| `code` | text, unique, nullable | optional human label (`F1-R2-B7`) |
| `name` | text | `Box 7` |
| `containerTypeId` | FK | see `ContainerType` |
| `parentId` | FK nullable | null = root (a site or building) |
| `gridRows`, `gridColumns` | int nullable | non-null ⇔ grid-capable |
| `rowLabelScheme` | enum | `alpha` \| `numeric` |
| `columnLabelScheme` | enum | `alpha` \| `numeric` |
| `temperatureC` | real nullable | `-80`, `4`, ambient = null |
| `notes` | text nullable | |
| `status` | enum | `active` \| `archived` |
| `createdAt`, `updatedAt` | UTC timestamp | |

Invariants: parent chain is acyclic; a container with grid dimensions may hold items at
positions; archived containers hold no active items.

### 2.2 `ContainerType`

User-editable vocabulary — `Site`, `Room`, `Freezer`, `Shelf`, `Rack`, `Drawer`, `Cabinet`,
`Box`, `Plate`. Fields: `id`, `name`, `canHaveGrid` (bool), `defaultRows`, `defaultColumns`,
`icon`, `sortOrder`.

Rationale: making this data rather than an enum is what lets a paleontology collection and a
molecular lab use the same build.

### 2.3 `Position`

An addressable slot inside a grid-capable container. Materialised on grid creation so that
uniqueness can be enforced by the database rather than by application code.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `containerId` | FK | must be grid-capable |
| `rowIndex`, `columnIndex` | int | 1-based |
| `label` | text | derived, e.g. `C04`; stored for search |

Unique on (`containerId`, `rowIndex`, `columnIndex`) and on (`containerId`, `label`).

### 2.4 `Item`

The tracked physical object — a tube, a specimen, a fossil, a herbarium sheet.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | immutable internal identity |
| `code` | text, unique among active | user-facing identifier |
| `name` | text | short label |
| `itemTypeId` | FK | see `ItemType` |
| `status` | enum | `active` \| `checked_out` \| `consumed` \| `destroyed` \| `transferred_out` \| `lost` \| `archived` |
| `containerId` | FK nullable | derived current location |
| `positionId` | FK nullable | non-null only if the container is grid-capable |
| `quantityValue` | real nullable | |
| `quantityUnit` | text nullable | required when value present |
| `parentItemId` | FK nullable | reserved for v0.3 derivation |
| `collectedAt` | date nullable | with `collectedAtPrecision` (`day`\|`month`\|`year`) |
| `collectedBy` | text nullable | |
| `localityText` | text nullable | verbatim, never normalised away |
| `latitude`, `longitude` | real nullable | with `coordinateUncertaintyMeters` |
| `notes` | text nullable | |
| `createdAt`, `updatedAt` | UTC timestamp | |

Invariants: `positionId` implies `containerId` and position belongs to that container; a
position holds at most one active item; terminal statuses forbid location change; quantity
value without unit is invalid; verbatim locality and dates are preserved as entered alongside
any parsed value.

### 2.5 `ItemType` and `FieldDefinition`

`ItemType`: user-defined (`DNA extract`, `Tissue`, `Fossil`, `Culture`), with
`requiresQuantity` and optional default unit.

`FieldDefinition`: per item type — `key`, `label`, `dataType`
(`text|number|date|boolean|enum`), `unit`, `required`, `enumOptions`, `sortOrder`.
`ItemFieldValue` stores (`itemId`, `fieldDefinitionId`, value columns typed by kind).

Rationale: a typed extension table, not a JSON blob, so values remain queryable and
validatable. A JSON column was considered and rejected — it defers all validation to
application code and makes search awkward, which is exactly the spreadsheet failure mode we
are replacing.

### 2.6 `Event` (append-only)

The custody and audit log. One row per state change.

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `occurredAt` | UTC timestamp | |
| `recordedAt` | UTC timestamp | may differ from `occurredAt` for back-dated entries |
| `actorName` | text | operator identity, no authentication |
| `subjectKind` | enum | `item` \| `container` |
| `subjectId` | ULID | |
| `type` | enum | `created`, `moved`, `renamed`, `quantity_changed`, `status_changed`, `field_changed`, `checked_out`, `checked_in`, `derived`, `imported`, `corrected`, `archived` |
| `fromJson`, `toJson` | text nullable | previous/new value snapshot for the changed aspect |
| `note` | text nullable | |
| `batchId` | ULID nullable | groups events from one bulk action or import |

Invariants: no updates, no deletes; every mutation of an item or container writes exactly one
event; corrections append rather than rewrite; `batchId` makes a bulk operation reviewable as
one action.

### 2.7 `DerivationLink` (v0.3, modelled now)

`(parentItemId, childItemId, relationship, occurredAt, note)` where relationship ∈
`aliquot | subsample | extraction | preparation | pooled_from`. Kept separate from `Event` so
that scientific lineage can be traversed without walking the audit log, and so that
many-to-one pooling is expressible.

### 2.8 Supporting entities

- `Database metadata`: schema version, application version that created it, database id.
- `Setting`: operator name, code-generation pattern, display preferences.
- `ImportBatch`: source filename, row count, mapping used, timestamp, resulting `batchId` —
  so an import can be explained and audited months later.
- `Attachment` (v0.3): file path or blob, checksum, kind, linked item.

---

## 3. Relationships

```
ContainerType 1───* Container
Container 0..1───* Container            (self-referencing tree)
Container 1───* Position                 (only when grid-capable)
Container 1───* Item                     (current location, derived)
Position 0..1───0..1 Item                (at most one active item)
ItemType 1───* Item
ItemType 1───* FieldDefinition 1───* ItemFieldValue *───1 Item
Item 1───* Event                         (append-only history)
Container 1───* Event
Item 1───* DerivationLink *───1 Item     (parent/child lineage, v0.3)
ImportBatch 1───* Event
```

Textual ER diagram deliberately; a rendered diagram will be added when the schema is
implemented rather than maintained twice in Phase 0.

---

## 4. Worked examples

**Molecular lab.** `Site: Lab A` → `Freezer 1` (−80 °C) → `Rack 2` → `Box 7` (9×9 grid) →
positions `A1…I9`. Item `MB-0001`, type `DNA extract`, quantity `50 µL`, at `Box 7 / C04`.
Path: `Lab A / Freezer 1 / Rack 2 / Box 7 / C04`.

**Paleontology collection.** `Site: Store 2` → `Cabinet 4` → `Drawer 12` (no grid) → item
`PAL-2024-0187`, type `Fossil`, locality verbatim `Las Hoyas, Cuenca, Spain`, collected
`1998-07` (precision `month`). Path: `Store 2 / Cabinet 4 / Drawer 12`. No position, and no
invented one.

**Movement.** Moving `MB-0001` to `Box 8 / A01` writes one `moved` event with
`from = {container: Box 7, position: C04}` and `to = {container: Box 8, position: A01}`, and
updates the item's derived location. Attempting to move it onto an occupied position fails
before any write.

**Container move.** Moving `Rack 2` into `Freezer 2` writes one container-level `moved` event.
Contained items' paths change because the path is computed from the tree — no per-item events,
which keeps a freezer reorganisation from writing thousands of rows.

---

## 5. Deliberate omissions

| Not modelled | Why |
|---|---|
| Consent, subjects, clinical protocols | regulated-biobank territory; OpenSpecimen's domain |
| Studies, requests, worksheets, CoAs | analytical LIMS; SENAITE's domain |
| Full taxonomic hierarchy and nomenclature | Specify/Symbiota's domain; we store a determination string and defer real taxonomy to v0.4 |
| Agents/people as entities | free-text names until users prove they need a directory |
| Permissions, roles, users | single-user product |
| Georeferencing pipelines | verbatim locality plus optional coordinates only |
| Freeze/thaw cycles, temperature excursions | no evidence our users track these yet |

---

## 6. Open modelling questions

1. Should `Item` carry `verbatim` copies of every parsed field (dates, coordinates), or only
   locality and date? Leaning toward verbatim-for-all on import, as Darwin Core practice
   suggests.
2. Is denormalised current location the right trade against deriving it from events? Proposed:
   yes, with a consistency check command, because search performance is a hard requirement.
3. Should positions be materialised rows or computed? Proposed: materialised, so uniqueness is
   a database constraint.
4. How should re-labelling a container's grid scheme (numeric ↔ alpha) treat existing
   positions? Needs an ADR before v0.2.
5. Do collections need a `catalogNumber` distinct from `code`? Probably yes for Darwin Core
   export; deferred to v0.4.
