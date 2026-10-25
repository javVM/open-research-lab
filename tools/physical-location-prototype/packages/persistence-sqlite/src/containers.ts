import { newUlid, type Container, type ContainerType, type Position, type Ulid } from '@sample-operations/core';
import type { Db } from './db-types.js';
import { nodeUlidSource } from './ulid-source.js';

/** Default container-type vocabulary, seeded on first open. User-editable data. */
export const DEFAULT_CONTAINER_TYPES: ReadonlyArray<{
  name: string;
  canHaveGrid: boolean;
  defaultRows?: number;
  defaultColumns?: number;
  icon?: string;
  sortOrder: number;
}> = [
  { name: 'Site', canHaveGrid: false, sortOrder: 10 },
  { name: 'Building', canHaveGrid: false, sortOrder: 20 },
  { name: 'Floor', canHaveGrid: false, sortOrder: 30 },
  { name: 'Room', canHaveGrid: false, sortOrder: 40 },
  { name: 'Freezer', canHaveGrid: false, sortOrder: 50 },
  { name: 'Rack', canHaveGrid: false, sortOrder: 60 },
  { name: 'Shelf', canHaveGrid: false, sortOrder: 70 },
  { name: 'Drawer', canHaveGrid: false, sortOrder: 80 },
  { name: 'Cabinet', canHaveGrid: false, sortOrder: 90 },
  { name: 'Box', canHaveGrid: true, defaultRows: 9, defaultColumns: 9, sortOrder: 100 },
  { name: 'Plate', canHaveGrid: true, defaultRows: 8, defaultColumns: 12, sortOrder: 110 },
  { name: 'Tray', canHaveGrid: true, sortOrder: 120 },
];

interface ContainerTypeRow {
  id: string;
  name: string;
  can_have_grid: number;
  default_rows: number | null;
  default_columns: number | null;
  icon: string | null;
  sort_order: number;
}

interface ContainerRow {
  id: string;
  code: string | null;
  name: string;
  container_type_id: string;
  parent_id: string | null;
  grid_rows: number | null;
  grid_columns: number | null;
  row_label_scheme: 'alpha' | 'numeric';
  column_label_scheme: 'alpha' | 'numeric';
  temperature_c: number | null;
  notes: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

interface PositionRow {
  id: string;
  container_id: string;
  row_index: number;
  column_index: number;
  label: string;
}

function toContainerType(row: ContainerTypeRow): ContainerType {
  return {
    id: row.id,
    name: row.name,
    canHaveGrid: row.can_have_grid === 1,
    defaultRows: row.default_rows,
    defaultColumns: row.default_columns,
    icon: row.icon ?? undefined,
    sortOrder: row.sort_order,
  };
}

function toContainer(row: ContainerRow): Container {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    containerTypeId: row.container_type_id,
    parentId: row.parent_id,
    gridRows: row.grid_rows,
    gridColumns: row.grid_columns,
    rowLabelScheme: row.row_label_scheme,
    columnLabelScheme: row.column_label_scheme,
    temperatureC: row.temperature_c,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPosition(row: PositionRow): Position {
  return {
    id: row.id,
    containerId: row.container_id,
    rowIndex: row.row_index,
    columnIndex: row.column_index,
    label: row.label,
  };
}

/** Idempotently seed the default container types (insert only when missing). */
export function seedContainerTypes(db: Db): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO container_type (id, name, can_have_grid, default_rows, default_columns, icon, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const findId = db.prepare('SELECT id FROM container_type WHERE name = ?');
  for (const type of DEFAULT_CONTAINER_TYPES) {
    const existing = findId.get(type.name) as { id: string } | undefined;
    const id: Ulid = existing?.id ?? newUlid(nodeUlidSource);
    insert.run(
      id,
      type.name,
      type.canHaveGrid ? 1 : 0,
      type.defaultRows ?? null,
      type.defaultColumns ?? null,
      type.icon ?? null,
      type.sortOrder,
    );
  }
}

export function listContainerTypes(db: Db): ContainerType[] {
  const rows = db.prepare('SELECT * FROM container_type ORDER BY sort_order, name').all() as
    | ContainerTypeRow[];
  return rows.map(toContainerType);
}

export function findContainerTypeByName(db: Db, name: string): ContainerType | undefined {
  const row = db.prepare('SELECT * FROM container_type WHERE name = ?').get(name) as
    | ContainerTypeRow
    | undefined;
  return row ? toContainerType(row) : undefined;
}

export function insertContainerType(db: Db, type: ContainerType): void {
  db.prepare(
    `INSERT INTO container_type (id, name, can_have_grid, default_rows, default_columns, icon, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    type.id,
    type.name,
    type.canHaveGrid ? 1 : 0,
    type.defaultRows ?? null,
    type.defaultColumns ?? null,
    type.icon ?? null,
    type.sortOrder,
  );
}

export function insertContainer(db: Db, container: Container): void {
  db.prepare(
    `INSERT INTO container (id, code, name, container_type_id, parent_id, grid_rows, grid_columns,
                            row_label_scheme, column_label_scheme, temperature_c, notes, status,
                            created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    container.id,
    container.code ?? null,
    container.name,
    container.containerTypeId,
    container.parentId,
    container.gridRows ?? null,
    container.gridColumns ?? null,
    container.rowLabelScheme,
    container.columnLabelScheme,
    container.temperatureC ?? null,
    container.notes ?? null,
    container.status,
    container.createdAt,
    container.updatedAt,
  );
}

export function getContainer(db: Db, id: Ulid): Container | undefined {
  const row = db.prepare('SELECT * FROM container WHERE id = ?').get(id) as
    | ContainerRow
    | undefined;
  return row ? toContainer(row) : undefined;
}

/** Find a child of `parentId` by name; `parentId === null` searches roots. */
export function findChildContainerByName(
  db: Db,
  parentId: Ulid | null,
  name: string,
): Container | undefined {
  const row = db.prepare('SELECT * FROM container WHERE parent_id IS ? AND name = ?').get(parentId, name) as
    | ContainerRow
    | undefined;
  return row ? toContainer(row) : undefined;
}

export function listContainers(db: Db): Container[] {
  const rows = db.prepare('SELECT * FROM container ORDER BY created_at').all() as ContainerRow[];
  return rows.map(toContainer);
}

export function setContainerParent(db: Db, id: Ulid, newParentId: Ulid | null, updatedAt: string): void {
  db.prepare('UPDATE container SET parent_id = ?, updated_at = ? WHERE id = ?').run(
    newParentId,
    updatedAt,
    id,
  );
}

export function setContainerStatus(db: Db, id: Ulid, status: Container['status'], updatedAt: string): void {
  db.prepare('UPDATE container SET status = ?, updated_at = ? WHERE id = ?').run(status, updatedAt, id);
}

export function insertPositions(db: Db, positions: Position[]): void {
  const insert = db.prepare(
    `INSERT INTO position (id, container_id, row_index, column_index, label) VALUES (?, ?, ?, ?, ?)`,
  );
  for (const position of positions) {
    insert.run(position.id, position.containerId, position.rowIndex, position.columnIndex, position.label);
  }
}

export function listPositionsForContainer(db: Db, containerId: Ulid): Position[] {
  const rows = db
    .prepare('SELECT * FROM position WHERE container_id = ? ORDER BY row_index, column_index')
    .all(containerId) as PositionRow[];
  return rows.map(toPosition);
}

export function findPosition(
  db: Db,
  containerId: Ulid,
  rowIndex: number,
  columnIndex: number,
): Position | undefined {
  const row = db
    .prepare('SELECT * FROM position WHERE container_id = ? AND row_index = ? AND column_index = ?')
    .get(containerId, rowIndex, columnIndex) as PositionRow | undefined;
  return row ? toPosition(row) : undefined;
}
