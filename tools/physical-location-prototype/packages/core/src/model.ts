/**
 * Domain model for Sample Operations — the physical-custody layer.
 *
 * This is the real model, not the prototype's simplification: `Position` is a
 * distinct entity (not a leaf `Location`), quantities carry units, identifiers
 * are ULIDs, and history is an append-only event log. It matches
 * `docs/architecture/domain-model.md`; anything here that deviates from that
 * document is a bug to be fixed, not a shortcut to be kept.
 */

/** An immutable, sortable, opaque identifier (see ADR-0006). */
export type Ulid = string;

export type ContainerStatus = 'active' | 'archived';

export type ItemStatus =
  | 'active'
  | 'checked_out'
  | 'consumed'
  | 'destroyed'
  | 'transferred_out'
  | 'lost'
  | 'archived';

/** How a grid-capable container labels its rows/columns (A1…H12 vs 1…81). */
export type LabelScheme = 'alpha' | 'numeric';

/** Precision with which a date is known. Never guess a missing day. */
export type DatePrecision = 'day' | 'month' | 'year';

export type SubjectKind = 'item' | 'container';

export type EventType =
  | 'created'
  | 'moved'
  | 'renamed'
  | 'quantity_changed'
  | 'status_changed'
  | 'field_changed'
  | 'checked_out'
  | 'checked_in'
  | 'derived'
  | 'imported'
  | 'corrected'
  | 'archived';

export type DerivationRelationship =
  | 'aliquot'
  | 'subsample'
  | 'extraction'
  | 'preparation'
  | 'pooled_from';

/**
 * A quantity with an explicit unit. A bare number is invalid everywhere in the
 * model (invariant 8): `value` and `unit` are either both present or both
 * absent.
 */
export interface Quantity {
  value: number;
  unit: string;
}

/**
 * A date whose precision is explicit and whose verbatim text is preserved
 * alongside the parsed parts. "1998-07" and "circa 1870" are legitimate data.
 */
export interface PartialDate {
  /** Original text exactly as entered. */
  verbatim: string;
  year: number;
  /** 1–12. Absent when precision is `'year'`. */
  month?: number;
  /** 1–31. Absent when precision is `'year'` or `'month'`. */
  day?: number;
  precision: DatePrecision;
}

/** Optional coordinates, always with an uncertainty allowance when present. */
export interface Coordinates {
  latitude: number;
  longitude: number;
  uncertaintyMeters?: number;
}

export interface ContainerType {
  id: Ulid;
  name: string;
  canHaveGrid: boolean;
  defaultRows?: number | null;
  defaultColumns?: number | null;
  icon?: string;
  sortOrder: number;
}

export interface Container {
  id: Ulid;
  /** Optional human label (`F1-R2-B7`); nullable and user-owned. */
  code?: string | null;
  name: string;
  containerTypeId: Ulid;
  /** Null = a root container (site/building). */
  parentId: Ulid | null;
  /** Non-null ⇔ grid-capable. */
  gridRows?: number | null;
  gridColumns?: number | null;
  rowLabelScheme: LabelScheme;
  columnLabelScheme: LabelScheme;
  /** `-80`, `4`; ambient = null. */
  temperatureC?: number | null;
  notes?: string | null;
  status: ContainerStatus;
  /** UTC ISO-8601 timestamp. */
  createdAt: string;
  updatedAt: string;
}

/** An addressable slot inside a grid-capable container. */
export interface Position {
  id: Ulid;
  containerId: Ulid;
  /** 1-based. */
  rowIndex: number;
  /** 1-based. */
  columnIndex: number;
  /** Derived label (`C04`), stored for search. */
  label: string;
}

export interface ItemType {
  id: Ulid;
  name: string;
  requiresQuantity: boolean;
  defaultUnit?: string;
}

export type FieldDataType = 'text' | 'number' | 'date' | 'boolean' | 'enum';

export interface FieldDefinition {
  id: Ulid;
  itemTypeId: Ulid;
  key: string;
  label: string;
  dataType: FieldDataType;
  unit?: string;
  required: boolean;
  enumOptions?: string[];
  sortOrder: number;
}

/**
 * A typed extension value (one per `FieldDefinition`), never a JSON blob, so
 * values stay queryable and validatable. See `domain-model.md` §2.5.
 */
export type ItemFieldValue =
  | { itemId: Ulid; fieldDefinitionId: Ulid; kind: 'text'; text: string }
  | { itemId: Ulid; fieldDefinitionId: Ulid; kind: 'number'; number: number }
  | { itemId: Ulid; fieldDefinitionId: Ulid; kind: 'date'; date: PartialDate }
  | { itemId: Ulid; fieldDefinitionId: Ulid; kind: 'boolean'; boolean: boolean }
  | { itemId: Ulid; fieldDefinitionId: Ulid; kind: 'enum'; enum: string };

export interface Item {
  id: Ulid;
  /** Human-readable code; unique among active items (invariant 7). */
  code: string;
  name: string;
  itemTypeId: Ulid;
  status: ItemStatus;
  /** Derived current location. Null when the item has no location. */
  containerId: Ulid | null;
  /** Non-null only if `containerId` is a grid-capable container. */
  positionId: Ulid | null;
  quantity?: Quantity;
  /** Reserved for v0.3 derivation lineage. */
  parentItemId?: Ulid | null;
  collectedAt?: PartialDate;
  collectedBy?: string;
  /** Verbatim locality text, never normalised away. */
  localityText?: string;
  coordinates?: Coordinates;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Append-only custody/audit record (ADR-0007). Never updated, never deleted. */
export interface Event {
  id: Ulid;
  /** When the change happened. */
  occurredAt: string;
  /** When the change was recorded; may differ for back-dated entries. */
  recordedAt: string;
  actorName: string;
  subjectKind: SubjectKind;
  subjectId: Ulid;
  type: EventType;
  /** Previous/new snapshot (JSON) for the changed aspect. */
  fromJson?: string | null;
  toJson?: string | null;
  note?: string | null;
  /** Groups events from one bulk action or import. */
  batchId?: Ulid | null;
}

/** Scientific lineage, kept separate from the audit log (v0.3, modelled now). */
export interface DerivationLink {
  parentItemId: Ulid;
  childItemId: Ulid;
  relationship: DerivationRelationship;
  occurredAt: string;
  note?: string;
}

/** Metadata about an applied import, so it can be explained months later. */
export interface ImportBatch {
  id: Ulid;
  /** Shared with the events the import produced. */
  batchId: Ulid;
  sourceFilename: string;
  rowCount: number;
  /** JSON of the column mapping used. */
  mapping: string;
  importedAt: string;
}
