import { Injectable, inject } from '@angular/core';
import type { Dataset, ItemCategory, LocationType } from '../core/models';
import { ITEM_CATEGORIES } from '../core/models';
import { CollectionService } from './collection.service';
import { CsvError, detectDelimiter, parseCsv, type CsvTable } from './shared/csv';

export interface ImportValidationIssue {
  readonly line: number;
  readonly column: string;
  readonly reason: string;
}

export type ImportKind = 'items' | 'locations';

export interface ImportDryRunResult {
  readonly kind: ImportKind;
  readonly table: CsvTable;
  readonly columnMap: ColumnMap | LocationColumnMap;
  readonly issues: readonly ImportValidationIssue[];
  readonly validRows: readonly ValidatedRow[];
  readonly validLocationRows: readonly ValidatedLocationRow[];
  readonly totalRows: number;
}

export interface ColumnMap {
  readonly catalogueNumber: number | null;
  readonly label: number | null;
  readonly category: number | null;
  readonly status: number | null;
  readonly locationId: number | null;
}

export interface ValidatedRow {
  readonly line: number;
  readonly catalogueNumber: string;
  readonly label: string | null;
  readonly category: ItemCategory;
  readonly locationId: string | null;
}

export interface LocationColumnMap {
  readonly id: number | null;
  readonly name: number | null;
  readonly type: number | null;
  readonly parentId: number | null;
}

export interface ValidatedLocationRow {
  readonly line: number;
  readonly id: string;
  readonly name: string;
  readonly type: LocationType;
  readonly parentId: string | null;
}

const CATALOGUE_ALIASES = new Set([
  'catalognumber',
  'cataloguenumber',
  'catalogno',
  'catalogueno',
  'catalognr',
  'catalogid',
  'catno',
  'externalid',
  'code',
  'itemcode',
]);

const LABEL_ALIASES = new Set(['label', 'name', 'title', 'description', 'objectlabel']);

const CATEGORY_ALIASES = new Set(['category', 'type', 'itemcategory', 'specimencategory', 'materialtype']);

const STATUS_ALIASES = new Set(['status', 'state', 'itemstatus']);

const LOCATION_ALIASES = new Set(['locationid', 'location', 'storagelocation', 'position', 'currentlocation']);

const VALID_STATUS = new Set(['active', 'checked_out', 'lost', 'archived']);
const CATEGORY_SET = new Set<string>(ITEM_CATEGORIES);

const LOC_ID_ALIASES = new Set(['id', 'locationid', 'locid']);
const LOC_NAME_ALIASES = new Set(['name', 'locationname', 'title']);
const LOC_TYPE_ALIASES = new Set(['type', 'locationtype', 'kind', 'locationkind']);
const LOC_PARENT_ALIASES = new Set(['parentid', 'parent', 'parentname', 'parentlocation']);
const VALID_LOCATION_TYPES: ReadonlySet<string> = new Set([
  'building',
  'floor',
  'room',
  'cabinet',
  'drawer',
  'box',
  'tray',
  'position',
]);

function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectColumnMap(header: readonly string[]): ColumnMap {
  const map: { catalogueNumber: number | null; label: number | null; category: number | null; status: number | null; locationId: number | null } = {
    catalogueNumber: null,
    label: null,
    category: null,
    status: null,
    locationId: null,
  };
  for (let index = 0; index < header.length; index += 1) {
    const raw = header[index];
    if (raw === undefined) continue;
    const norm = normaliseHeader(raw.trim());
    if (map.catalogueNumber === null && CATALOGUE_ALIASES.has(norm)) {
      map.catalogueNumber = index;
    } else if (map.label === null && LABEL_ALIASES.has(norm)) {
      map.label = index;
    } else if (map.category === null && CATEGORY_ALIASES.has(norm)) {
      map.category = index;
    } else if (map.status === null && STATUS_ALIASES.has(norm)) {
      map.status = index;
    } else if (map.locationId === null && LOCATION_ALIASES.has(norm)) {
      map.locationId = index;
    }
  }
  return map;
}

export function detectLocationColumnMap(header: readonly string[]): LocationColumnMap {
  const map: { id: number | null; name: number | null; type: number | null; parentId: number | null } = {
    id: null,
    name: null,
    type: null,
    parentId: null,
  };
  for (let index = 0; index < header.length; index += 1) {
    const raw = header[index];
    if (raw === undefined) continue;
    const norm = normaliseHeader(raw.trim());
    if (map.id === null && LOC_ID_ALIASES.has(norm)) {
      map.id = index;
    } else if (map.name === null && LOC_NAME_ALIASES.has(norm)) {
      map.name = index;
    } else if (map.type === null && LOC_TYPE_ALIASES.has(norm)) {
      map.type = index;
    } else if (map.parentId === null && LOC_PARENT_ALIASES.has(norm)) {
      map.parentId = index;
    }
  }
  // Disambiguate: if header has single 'type' column and we already matched it as category for items, for locations we need type
  // Our detection above is fine.
  return map;
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly collection = inject(CollectionService);

  dryRun(text: string): ImportDryRunResult {
    let table: CsvTable;
    try {
      table = parseCsv(text, detectDelimiter(text));
    } catch (error) {
      const message = error instanceof CsvError ? error.message : String(error);
      return {
        kind: 'items',
        table: { header: [], rows: [], delimiter: ',' },
        columnMap: {
          catalogueNumber: null,
          label: null,
          category: null,
          status: null,
          locationId: null,
        },
        issues: [{ line: 1, column: 'file', reason: message }],
        validRows: [],
        validLocationRows: [],
        totalRows: 0,
      };
    }

    const columnMap = detectColumnMap(table.header);
    const locationColumnMap = detectLocationColumnMap(table.header);

    // Decide kind: items if catalogueNumber present, otherwise locations if name+type present
    const isItems = columnMap.catalogueNumber !== null;
    const isLocations = !isItems && locationColumnMap.name !== null && locationColumnMap.type !== null;

    if (!isItems && !isLocations) {
      return {
        kind: 'items',
        table,
        columnMap,
        issues: [
          {
            line: 1,
            column: table.header.join(', ') || 'header',
            reason: 'Formato no reconocido. Para ítems: catalogueNumber requerido. Para ubicaciones: name + type requeridos.',
          },
        ],
        validRows: [],
        validLocationRows: [],
        totalRows: table.rows.length,
      };
    }

    if (isLocations) {
      return this.dryRunLocations(table, locationColumnMap);
    }

    const issues: ImportValidationIssue[] = [];
    const validRows: ValidatedRow[] = [];

    const existingCodes = new Set(
      this.collection.dataset().items.map((item) => item.catalogueNumber.toLowerCase()),
    );
    const seenInFile = new Map<string, number>();

    for (const row of table.rows) {
      const line = row.line;
      const idx = columnMap.catalogueNumber!;
      const rawCode = (row.values[idx] ?? '').trim();
      if (rawCode === '') {
        issues.push({ line, column: table.header[idx] ?? 'catalogueNumber', reason: 'Catalogue number is empty.' });
        continue;
      }
      const lowerCode = rawCode.toLowerCase();
      if (existingCodes.has(lowerCode)) {
        issues.push({ line, column: table.header[idx] ?? 'catalogueNumber', reason: `Catalogue number "${rawCode}" already exists in the collection.` });
        continue;
      }
      if (seenInFile.has(lowerCode)) {
        issues.push({
          line,
          column: table.header[idx] ?? 'catalogueNumber',
          reason: `Duplicate catalogue number "${rawCode}" in file (first seen on line ${seenInFile.get(lowerCode)}).`,
        });
        continue;
      }
      seenInFile.set(lowerCode, line);

      let category: ItemCategory = 'item_unprocessed_matrix';
      if (columnMap.category !== null) {
        const rawCat = (row.values[columnMap.category] ?? '').trim();
        if (rawCat !== '') {
          if (!CATEGORY_SET.has(rawCat)) {
            issues.push({
              line,
              column: table.header[columnMap.category] ?? 'category',
              reason: `Unknown category "${rawCat}".`,
            });
            continue;
          }
          category = rawCat as ItemCategory;
        }
      }

      if (columnMap.status !== null) {
        const rawStatus = (row.values[columnMap.status] ?? '').trim().toLowerCase();
        if (rawStatus !== '' && !VALID_STATUS.has(rawStatus)) {
          issues.push({
            line,
            column: table.header[columnMap.status] ?? 'status',
            reason: `Invalid status "${rawStatus}". Expected active, checked_out, lost or archived.`,
          });
          continue;
        }
      }

      let locationId: string | null = null;
      if (columnMap.locationId !== null) {
        const rawLoc = (row.values[columnMap.locationId] ?? '').trim();
        if (rawLoc !== '') {
          const locExists = this.collection.dataset().locations.some((loc) => loc.id === rawLoc || loc.name.toLowerCase() === rawLoc.toLowerCase());
          if (!locExists) {
            issues.push({
              line,
              column: table.header[columnMap.locationId] ?? 'locationId',
              reason: `Location "${rawLoc}" not found.`,
            });
            continue;
          }
          // Resolve to actual id if name was given
          const found = this.collection.dataset().locations.find((loc) => loc.id === rawLoc || loc.name.toLowerCase() === rawLoc.toLowerCase());
          locationId = found?.id ?? rawLoc;
        }
      }

      const label =
        columnMap.label !== null ? ((row.values[columnMap.label] ?? '').trim() || null) : null;

      validRows.push({ line, catalogueNumber: rawCode, label, category, locationId });
    }

    return { kind: 'items', table, columnMap, issues, validRows, validLocationRows: [], totalRows: table.rows.length };
  }

  private dryRunLocations(table: CsvTable, columnMap: LocationColumnMap): ImportDryRunResult {
    const issues: ImportValidationIssue[] = [];
    const validLocationRows: ValidatedLocationRow[] = [];

    const existingIds = new Set(this.collection.dataset().locations.map((loc) => loc.id));
    const existingNames = new Set(this.collection.dataset().locations.map((loc) => loc.name.toLowerCase()));
    const seenIds = new Map<string, number>();
    const seenNames = new Map<string, number>();
    const fileIds = new Set<string>();

    // Collect file ids for parent validation
    for (const row of table.rows) {
      const rawId = columnMap.id !== null ? (row.values[columnMap.id] ?? '').trim() : '';
      if (rawId) fileIds.add(rawId);
    }

    for (const row of table.rows) {
      const line = row.line;
      const rawName = columnMap.name !== null ? (row.values[columnMap.name] ?? '').trim() : '';
      const rawType = columnMap.type !== null ? (row.values[columnMap.type] ?? '').trim().toLowerCase() : '';
      const rawId = columnMap.id !== null ? (row.values[columnMap.id] ?? '').trim() : '';
      const rawParent = columnMap.parentId !== null ? (row.values[columnMap.parentId] ?? '').trim() : '';

      if (rawName === '') {
        issues.push({ line, column: table.header[columnMap.name ?? 0] ?? 'name', reason: 'Name is empty.' });
        continue;
      }
      if (rawType === '' || !VALID_LOCATION_TYPES.has(rawType)) {
        issues.push({
          line,
          column: table.header[columnMap.type ?? 0] ?? 'type',
          reason: `Invalid type "${rawType}". Expected one of: ${Array.from(VALID_LOCATION_TYPES).join(', ')}.`,
        });
        continue;
      }
      const lowerName = rawName.toLowerCase();
      if (existingNames.has(lowerName) || seenNames.has(lowerName)) {
        // Allow duplicate names? For backup restore, names may repeat across different parents, but we treat as error if same name under same parent? Simplify: check duplicate id only
      }
      if (rawId) {
        if (existingIds.has(rawId)) {
          issues.push({ line, column: table.header[columnMap.id ?? 0] ?? 'id', reason: `Location id "${rawId}" already exists.` });
          continue;
        }
        if (seenIds.has(rawId)) {
          issues.push({ line, column: table.header[columnMap.id ?? 0] ?? 'id', reason: `Duplicate id "${rawId}" in file (line ${seenIds.get(rawId)}).` });
          continue;
        }
        seenIds.set(rawId, line);
      }

      let parentId: string | null = null;
      if (rawParent) {
        const parentExists =
          this.collection.dataset().locations.some((loc) => loc.id === rawParent) || fileIds.has(rawParent);
        if (!parentExists) {
          issues.push({ line, column: table.header[columnMap.parentId ?? 0] ?? 'parentId', reason: `Parent "${rawParent}" not found.` });
          continue;
        }
        parentId = rawParent;
      }

      const id = rawId || `loc-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
      validLocationRows.push({ line, id, name: rawName, type: rawType as LocationType, parentId });
      if (rawName) seenNames.set(lowerName, line);
    }

    return {
      kind: 'locations',
      table,
      columnMap,
      issues,
      validRows: [],
      validLocationRows,
      totalRows: table.rows.length,
    };
  }

  importValidated(validRows: readonly ValidatedRow[]): number {
    if (validRows.length === 0) return 0;
    // Atomic: we already validated dry-run; now mutate in one transaction.
    // CollectionService.addItem does single-item mutations, but we can batch via setDataset
    // to keep it atomic and avoid intermediate history inconsistencies.
    const dataset: Dataset = this.collection.dataset();
    const existingIds = new Set(dataset.items.map((i) => i.id));
    const existingCodes = new Set(dataset.items.map((i) => i.catalogueNumber.toLowerCase()));
    // Double-check no race (in case dataset changed between dryRun and import)
    for (const row of validRows) {
      if (existingCodes.has(row.catalogueNumber.toLowerCase())) {
        throw new Error(`Catalogue number "${row.catalogueNumber}" already exists.`);
      }
      existingCodes.add(row.catalogueNumber.toLowerCase());
    }

    let items = [...dataset.items];
    let movements = [...dataset.movements];

    for (const row of validRows) {
      const id = `item-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
      // Ensure unique id (fallback collision check)
      let finalId = id;
      while (existingIds.has(finalId)) {
        finalId = `item-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
      }
      existingIds.add(finalId);
      const item = {
        id: finalId,
        catalogueNumber: row.catalogueNumber,
        label: row.label ?? undefined,
        category: row.category,
        locationId: row.locationId,
        status: 'active' as const,
      };
      items.push(item);
      if (row.locationId) {
        movements.push({
          id: `mov-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`,
          itemId: finalId,
          fromLocationId: null,
          toLocationId: row.locationId,
          occurredAt: new Date().toISOString(),
          note: 'Imported via CSV',
        });
      }
    }

    this.collection.setDataset({ ...dataset, items, movements });
    return validRows.length;
  }

  importValidatedLocations(validRows: readonly ValidatedLocationRow[]): number {
    if (validRows.length === 0) return 0;
    const dataset: Dataset = this.collection.dataset();
    const existingIds = new Set(dataset.locations.map((l) => l.id));
    for (const row of validRows) {
      if (existingIds.has(row.id)) {
        throw new Error(`Location id "${row.id}" already exists.`);
      }
      existingIds.add(row.id);
    }
    const locations = [...dataset.locations];
    for (const row of validRows) {
      locations.push({
        id: row.id,
        parentId: row.parentId,
        name: row.name,
        type: row.type,
      });
    }
    this.collection.setDataset({ ...dataset, locations });
    return validRows.length;
  }
}
