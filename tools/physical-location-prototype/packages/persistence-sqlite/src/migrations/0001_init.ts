/**
 * Migration 0001 — initial schema.
 *
 * Hand-written SQL (ADR-0005). Database-level constraints enforce the invariants
 * that SQLite can express; the rest are enforced by the domain layer. See
 * `docs/architecture/domain-model.md`.
 */

export const version = 1;

export const sql = `
-- Vocabulary: container types (user-editable; "Cabinet" or "Dewar" needs no release).
CREATE TABLE container_type (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  can_have_grid   INTEGER NOT NULL DEFAULT 0 CHECK (can_have_grid IN (0, 1)),
  default_rows    INTEGER,
  default_columns INTEGER,
  icon            TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- The recursive container tree (invariant 3 is enforced in the application layer).
CREATE TABLE container (
  id                  TEXT PRIMARY KEY,
  code                TEXT,
  name                TEXT NOT NULL,
  container_type_id   TEXT NOT NULL REFERENCES container_type(id),
  parent_id           TEXT REFERENCES container(id),
  grid_rows           INTEGER,
  grid_columns        INTEGER,
  row_label_scheme    TEXT NOT NULL CHECK (row_label_scheme IN ('alpha', 'numeric')),
  column_label_scheme TEXT NOT NULL CHECK (column_label_scheme IN ('alpha', 'numeric')),
  temperature_c       REAL,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  CHECK ((grid_rows IS NULL) = (grid_columns IS NULL)),
  CHECK (grid_rows IS NULL OR grid_rows > 0),
  CHECK (grid_columns IS NULL OR grid_columns > 0)
);

CREATE INDEX idx_container_parent ON container(parent_id);

-- Materialised grid positions (invariant 4: uniqueness enforced here).
CREATE TABLE position (
  id           TEXT PRIMARY KEY,
  container_id TEXT NOT NULL REFERENCES container(id),
  row_index    INTEGER NOT NULL,
  column_index INTEGER NOT NULL,
  label        TEXT NOT NULL,
  UNIQUE (container_id, row_index, column_index),
  UNIQUE (container_id, label)
);

-- Item types: user-defined vocabulary with optional default unit.
CREATE TABLE item_type (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL UNIQUE,
  requires_quantity INTEGER NOT NULL DEFAULT 0 CHECK (requires_quantity IN (0, 1)),
  default_unit      TEXT
);

-- Per-item-type custom field definitions.
CREATE TABLE field_definition (
  id           TEXT PRIMARY KEY,
  item_type_id TEXT NOT NULL REFERENCES item_type(id),
  key          TEXT NOT NULL,
  label        TEXT NOT NULL,
  data_type    TEXT NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'boolean', 'enum')),
  unit         TEXT,
  required     INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),
  enum_options TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (item_type_id, key)
);

-- The tracked physical object.
CREATE TABLE item (
  id                        TEXT PRIMARY KEY,
  code                      TEXT NOT NULL,
  name                      TEXT NOT NULL,
  item_type_id              TEXT NOT NULL REFERENCES item_type(id),
  status                    TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'checked_out', 'consumed', 'destroyed',
                                               'transferred_out', 'lost', 'archived')),
  container_id              TEXT REFERENCES container(id),
  position_id               TEXT REFERENCES position(id),
  quantity_value            REAL,
  quantity_unit             TEXT,
  parent_item_id            TEXT REFERENCES item(id),
  collected_verbatim        TEXT,
  collected_year            INTEGER,
  collected_month           INTEGER,
  collected_day             INTEGER,
  collected_precision       TEXT CHECK (collected_precision IN ('day', 'month', 'year')),
  collected_by              TEXT,
  locality_text             TEXT,
  latitude                  REAL,
  longitude                 REAL,
  coordinate_uncertainty_m  REAL,
  notes                     TEXT,
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL,
  CHECK ((quantity_value IS NULL) = (quantity_unit IS NULL)),
  CHECK (position_id IS NULL OR container_id IS NOT NULL)
);

-- Invariant 7: a human-readable code is unique among non-archived items.
CREATE UNIQUE INDEX idx_item_code_active ON item(code) WHERE status <> 'archived';

-- Invariant 1: a grid position holds at most one active/held item.
CREATE UNIQUE INDEX idx_item_position_held ON item(position_id)
  WHERE position_id IS NOT NULL
    AND status NOT IN ('consumed', 'destroyed', 'transferred_out', 'lost', 'archived');

-- Typed extension values (one row per item × field definition).
CREATE TABLE item_field_value (
  item_id             TEXT NOT NULL REFERENCES item(id),
  field_definition_id TEXT NOT NULL REFERENCES field_definition(id),
  value_text          TEXT,
  value_number        REAL,
  value_date_verbatim TEXT,
  value_date_year     INTEGER,
  value_date_month    INTEGER,
  value_date_day      INTEGER,
  value_date_precision TEXT,
  value_boolean       INTEGER,
  value_enum          TEXT,
  PRIMARY KEY (item_id, field_definition_id)
);

-- Append-only event log (ADR-0007).
CREATE TABLE event (
  id           TEXT PRIMARY KEY,
  occurred_at  TEXT NOT NULL,
  recorded_at  TEXT NOT NULL,
  actor_name   TEXT NOT NULL,
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('item', 'container')),
  subject_id   TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('created', 'moved', 'renamed', 'quantity_changed',
                                             'status_changed', 'field_changed', 'checked_out',
                                             'checked_in', 'derived', 'imported', 'corrected',
                                             'archived')),
  from_json    TEXT,
  to_json      TEXT,
  note         TEXT,
  batch_id     TEXT
);

CREATE INDEX idx_event_subject ON event(subject_kind, subject_id, occurred_at);
CREATE INDEX idx_event_batch ON event(batch_id);

-- Invariant 6: events are append-only. The database refuses updates and deletes.
CREATE TRIGGER trg_event_no_update BEFORE UPDATE ON event
BEGIN
  SELECT RAISE(ABORT, 'events are append-only');
END;

CREATE TRIGGER trg_event_no_delete BEFORE DELETE ON event
BEGIN
  SELECT RAISE(ABORT, 'events are append-only');
END;

-- Scientific lineage, separate from the audit log (v0.3, modelled now).
CREATE TABLE derivation_link (
  parent_item_id TEXT NOT NULL REFERENCES item(id),
  child_item_id  TEXT NOT NULL REFERENCES item(id),
  relationship   TEXT NOT NULL CHECK (relationship IN
                    ('aliquot', 'subsample', 'extraction', 'preparation', 'pooled_from')),
  occurred_at    TEXT NOT NULL,
  note           TEXT,
  PRIMARY KEY (parent_item_id, child_item_id, relationship)
);

-- Metadata about an applied import, so it can be explained later.
CREATE TABLE import_batch (
  id              TEXT PRIMARY KEY,
  batch_id        TEXT NOT NULL,
  source_filename TEXT NOT NULL,
  row_count       INTEGER NOT NULL,
  mapping         TEXT NOT NULL,
  imported_at     TEXT NOT NULL
);

CREATE TABLE setting (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE database_metadata (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
