import type { Item, ItemType, PartialDate, Ulid } from '@sample-operations/core';
import type { Db } from './db-types.js';

/** Default item-type vocabulary. A generic "Specimen" covers collections that do not subdivide. */
export const DEFAULT_ITEM_TYPES: ReadonlyArray<{
  name: string;
  requiresQuantity: boolean;
  defaultUnit?: string;
}> = [
  { name: 'Specimen', requiresQuantity: false },
  { name: 'Sample', requiresQuantity: true },
];

interface ItemTypeRow {
  id: string;
  name: string;
  requires_quantity: number;
  default_unit: string | null;
}

interface ItemRow {
  id: string;
  code: string;
  name: string;
  item_type_id: string;
  status: Item['status'];
  container_id: string | null;
  position_id: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  parent_item_id: string | null;
  collected_verbatim: string | null;
  collected_year: number | null;
  collected_month: number | null;
  collected_day: number | null;
  collected_precision: 'day' | 'month' | 'year' | null;
  collected_by: string | null;
  locality_text: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_uncertainty_m: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toItemType(row: ItemTypeRow): ItemType {
  return {
    id: row.id,
    name: row.name,
    requiresQuantity: row.requires_quantity === 1,
    defaultUnit: row.default_unit ?? undefined,
  };
}

function toItem(row: ItemRow): Item {
  const collectedAt: PartialDate | undefined =
    row.collected_verbatim !== null && row.collected_year !== null
      ? {
          verbatim: row.collected_verbatim,
          year: row.collected_year,
          month: row.collected_month ?? undefined,
          day: row.collected_day ?? undefined,
          precision: row.collected_precision ?? 'day',
        }
      : undefined;

  const coordinates =
    row.latitude !== null && row.longitude !== null
      ? {
          latitude: row.latitude,
          longitude: row.longitude,
          uncertaintyMeters: row.coordinate_uncertainty_m ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    itemTypeId: row.item_type_id,
    status: row.status,
    containerId: row.container_id,
    positionId: row.position_id,
    quantity:
      row.quantity_value !== null && row.quantity_unit !== null
        ? { value: row.quantity_value, unit: row.quantity_unit }
        : undefined,
    parentItemId: row.parent_item_id ?? undefined,
    collectedAt,
    collectedBy: row.collected_by ?? undefined,
    localityText: row.locality_text ?? undefined,
    coordinates,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Idempotently seed the default item types. */
export function seedItemTypes(db: Db, newId: () => Ulid): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO item_type (id, name, requires_quantity, default_unit) VALUES (?, ?, ?, ?)',
  );
  for (const type of DEFAULT_ITEM_TYPES) {
    insert.run(newId(), type.name, type.requiresQuantity ? 1 : 0, type.defaultUnit ?? null);
  }
}

export function listItemTypes(db: Db): ItemType[] {
  const rows = db.prepare('SELECT * FROM item_type ORDER BY name').all() as ItemTypeRow[];
  return rows.map(toItemType);
}

export function findItemTypeByName(db: Db, name: string): ItemType | undefined {
  const row = db.prepare('SELECT * FROM item_type WHERE name = ?').get(name) as
    | ItemTypeRow
    | undefined;
  return row ? toItemType(row) : undefined;
}

export function insertItemType(db: Db, type: ItemType): void {
  db.prepare(
    'INSERT INTO item_type (id, name, requires_quantity, default_unit) VALUES (?, ?, ?, ?)',
  ).run(type.id, type.name, type.requiresQuantity ? 1 : 0, type.defaultUnit ?? null);
}

export function insertItem(db: Db, item: Item): void {
  db.prepare(
    `INSERT INTO item (id, code, name, item_type_id, status, container_id, position_id,
                       quantity_value, quantity_unit, parent_item_id, collected_verbatim,
                       collected_year, collected_month, collected_day, collected_precision,
                       collected_by, locality_text, latitude, longitude, coordinate_uncertainty_m,
                       notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    item.id,
    item.code,
    item.name,
    item.itemTypeId,
    item.status,
    item.containerId,
    item.positionId,
    item.quantity?.value ?? null,
    item.quantity?.unit ?? null,
    item.parentItemId ?? null,
    item.collectedAt?.verbatim ?? null,
    item.collectedAt?.year ?? null,
    item.collectedAt?.month ?? null,
    item.collectedAt?.day ?? null,
    item.collectedAt?.precision ?? null,
    item.collectedBy ?? null,
    item.localityText ?? null,
    item.coordinates?.latitude ?? null,
    item.coordinates?.longitude ?? null,
    item.coordinates?.uncertaintyMeters ?? null,
    item.notes ?? null,
    item.createdAt,
    item.updatedAt,
  );
}

export function getItem(db: Db, id: Ulid): Item | undefined {
  const row = db.prepare('SELECT * FROM item WHERE id = ?').get(id) as ItemRow | undefined;
  return row ? toItem(row) : undefined;
}

export function findItemByCode(db: Db, code: string): Item | undefined {
  const row = db.prepare('SELECT * FROM item WHERE code = ?').get(code) as ItemRow | undefined;
  return row ? toItem(row) : undefined;
}

export function listItems(db: Db): Item[] {
  const rows = db.prepare('SELECT * FROM item ORDER BY code').all() as ItemRow[];
  return rows.map(toItem);
}

export function setItemLocation(
  db: Db,
  id: Ulid,
  containerId: Ulid | null,
  positionId: Ulid | null,
  updatedAt: string,
): void {
  db.prepare('UPDATE item SET container_id = ?, position_id = ?, updated_at = ? WHERE id = ?').run(
    containerId,
    positionId,
    updatedAt,
    id,
  );
}

export function setItemStatus(db: Db, id: Ulid, status: Item['status'], updatedAt: string): void {
  db.prepare('UPDATE item SET status = ?, updated_at = ? WHERE id = ?').run(status, updatedAt, id);
}
