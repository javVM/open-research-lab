/**
 * Disposable physical-tracking prototype (v0.1).
 *
 * Purpose: can we import only enough of a collection CSV to identify physical
 * objects, then create a storage hierarchy, move objects around, and answer
 * “where is X now?” and “what happened to X?”.
 *
 * This is intentionally not a product architecture. It is throwaway code that
 * explores the minimal surface area before real users are involved.
 */

import { randomUUID } from 'node:crypto';
import { detectDelimiter, parseCsv, type CsvTable } from './csv.ts';
import { normaliseHeader } from './detection.ts';

export type StorageType =
  | 'building'
  | 'room'
  | 'cabinet'
  | 'drawer'
  | 'tray'
  | 'work-area';

export interface Location {
  id: string;
  kind: StorageType;
  name: string;
  parentId: string | null;
}

export interface Item {
  id: string;
  externalId: string;
  label: string | null;
  currentLocationId: string | null;
  /** Verbatim, unmapped value from the source CSV. Not authoritative. */
  importedLocation: string | null;
}

export interface Movement {
  id: string;
  itemId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  actor: string;
  timestamp: string;
  note: string | null;
}

export interface Store {
  items: Map<string, Item>;
  locations: Map<string, Location>;
  movements: Movement[];
  /** Lookup from external (catalogue) id to internal item id. */
  externalIdIndex: Map<string, string>;
}

export class TrackError extends Error {}

const EXTERNAL_ID_ALIASES = new Set([
  'catalognumber',
  'cataloguenumber',
  'catalogno',
  'catalogueno',
  'catalognr',
  'catalogid',
  'catalogueid',
  'catno',
  'specimennumber',
  'specimenno',
  'specimenid',
  'specimencode',
  'externalid',
  'externalidentifier',
]);

const LABEL_ALIASES = new Set([
  'label',
  'objectlabel',
  'specimenlabel',
  'name',
  'objectname',
  'description',
]);

const LOCATION_ALIASES = new Set([
  'currentlocation',
  'storagelocation',
  'storage',
  'location',
  'shelf',
  'drawer',
  'tray',
  'cabinet',
  'room',
  'building',
  'position',
  'rack',
]);

export interface ColumnMap {
  externalId: number | null;
  label: number | null;
  location: number | null;
}

export function detectTrackingColumns(header: readonly string[]): ColumnMap {
  const map: ColumnMap = { externalId: null, label: null, location: null };

  for (let index = 0; index < header.length; index += 1) {
    const raw = header[index];
    if (raw === undefined) continue;
    const norm = normaliseHeader(raw.trim());

    if (map.externalId === null && EXTERNAL_ID_ALIASES.has(norm)) {
      map.externalId = index;
    } else if (map.label === null && LABEL_ALIASES.has(norm)) {
      map.label = index;
    } else if (map.location === null && LOCATION_ALIASES.has(norm)) {
      map.location = index;
    }
  }

  return map;
}

export function createStore(): Store {
  return {
    items: new Map(),
    locations: new Map(),
    movements: [],
    externalIdIndex: new Map(),
  };
}

export function createLocation(
  store: Store,
  kind: StorageType,
  name: string,
  parentId: string | null = null,
): Location {
  if (parentId !== null && !store.locations.has(parentId)) {
    throw new TrackError(`Parent location "${parentId}" does not exist.`);
  }
  const location: Location = { id: randomUUID(), kind, name, parentId };
  store.locations.set(location.id, location);
  return location;
}

export function createItem(
  store: Store,
  externalId: string,
  label: string | null = null,
  importedLocation: string | null = null,
): Item {
  if (store.externalIdIndex.has(externalId)) {
    throw new TrackError(`Duplicate external id "${externalId}".`);
  }
  const item: Item = {
    id: randomUUID(),
    externalId,
    label,
    currentLocationId: null,
    importedLocation,
  };
  store.items.set(item.id, item);
  store.externalIdIndex.set(item.externalId, item.id);
  return item;
}

export function findItemByExternalId(
  store: Store,
  externalId: string,
): Item | undefined {
  const id = store.externalIdIndex.get(externalId);
  return id === undefined ? undefined : store.items.get(id);
}

export function importCatalogueCsv(store: Store, text: string): number {
  const table = parseCsv(text, detectDelimiter(text));
  const columns = detectTrackingColumns(table.header);

  if (columns.externalId === null) {
    throw new TrackError(
      'No catalogue number or external id column was found.',
    );
  }

  let count = 0;
  for (const row of table.rows) {
    const raw = (row.values[columns.externalId] ?? '').trim();
    if (raw === '') continue;

    const label =
      columns.label !== null
        ? (row.values[columns.label] ?? '').trim() || null
        : null;
    const importedLocation =
      columns.location !== null
        ? (row.values[columns.location] ?? '').trim() || null
        : null;

    createItem(store, raw, label, importedLocation);
    count += 1;
  }

  return count;
}

export function moveItem(
  store: Store,
  itemId: string,
  toLocationId: string,
  actor: string,
  timestamp: string,
  note: string | null = null,
): Movement {
  const item = store.items.get(itemId);
  if (item === undefined) throw new TrackError(`Item "${itemId}" not found.`);
  if (!store.locations.has(toLocationId)) {
    throw new TrackError(`Location "${toLocationId}" does not exist.`);
  }

  const movement: Movement = {
    id: randomUUID(),
    itemId,
    fromLocationId: item.currentLocationId,
    toLocationId,
    actor,
    timestamp,
    note,
  };
  store.movements.push(movement);
  item.currentLocationId = toLocationId;
  return movement;
}

export function historyOf(store: Store, externalId: string): Movement[] {
  const item = findItemByExternalId(store, externalId);
  if (item === undefined) {
    throw new TrackError(`No item with external id "${externalId}".`);
  }
  return store.movements
    .filter((m) => m.itemId === item.id)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export interface WhereResult {
  item: Item;
  location: Location | null;
  previousLocation: Location | null;
  lastMovement: Movement | null;
}

export function whereIs(store: Store, externalId: string): WhereResult {
  const item = findItemByExternalId(store, externalId);
  if (item === undefined) {
    throw new TrackError(`No item with external id "${externalId}".`);
  }

  const movements = historyOf(store, externalId);
  const lastMovement = movements[movements.length - 1] ?? null;

  const location = item.currentLocationId
    ? store.locations.get(item.currentLocationId) ?? null
    : null;
  const previousLocation = lastMovement?.fromLocationId
    ? store.locations.get(lastMovement.fromLocationId) ?? null
    : null;

  return { item, location, previousLocation, lastMovement };
}

interface SerializedState {
  items: Item[];
  locations: Location[];
  movements: Movement[];
}

export function exportState(store: Store): string {
  const data: SerializedState = {
    items: Array.from(store.items.values()),
    locations: Array.from(store.locations.values()),
    movements: store.movements,
  };
  return JSON.stringify(data, null, 2);
}

export function importState(json: string): Store {
  const data = JSON.parse(json) as SerializedState;
  const store = createStore();

  for (const location of data.locations) {
    store.locations.set(location.id, location);
  }

  for (const item of data.items) {
    store.items.set(item.id, item);
    store.externalIdIndex.set(item.externalId, item.id);
  }

  store.movements = data.movements;
  return store;
}
