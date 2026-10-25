import {
  createEvent,
  materializePositions,
  parsePartialDate,
  parsePositionLabel,
  positionIsWithinBounds,
  type Container,
  type ContainerType,
  type Event,
  type ImportBatch,
  type Item,
  type ItemStatus,
  type ItemType,
  type Position,
  type Ulid,
} from '@sample-operations/core';
import {
  findContainerTypeByName,
  findItemTypeByName,
  findPosition,
  insertContainer,
  insertContainerType,
  insertEvent,
  insertImportBatch,
  insertItem,
  insertItemType,
  insertPositions,
  listContainerTypes,
  listContainers,
  listItems,
  listItemTypes,
  type Db,
} from '@sample-operations/persistence-sqlite';
import type { ParsedCsv } from './csv.js';
import { headerFor, type ColumnMapping } from './fields.js';
import { extractRowValues, validateRows, type ImportIssue } from './validate.js';

export interface ImportDeps {
  newId: () => Ulid;
  now: () => string;
  actorName: string;
}

type PlanOp =
  | { kind: 'containerType'; type: ContainerType }
  | { kind: 'itemType'; type: ItemType }
  | { kind: 'container'; container: Container }
  | { kind: 'positions'; positions: Position[] }
  | { kind: 'item'; item: Item; event: Event };

interface Plan {
  ops: PlanOp[];
  importBatch: ImportBatch;
  importedCount: number;
  createdContainers: number;
}

export interface PlanResult {
  issues: ImportIssue[];
  plan: Plan | null;
}

function containerKey(parentId: Ulid | null, name: string): string {
  return `${parentId ?? ''}\u0000${name}`;
}

function positionKey(rowIndex: number, columnIndex: number): string {
  return `${rowIndex}:${columnIndex}`;
}

function gridFromType(type: ContainerType): { rows: number; columns: number } | null {
  if (type.canHaveGrid && type.defaultRows && type.defaultColumns) {
    return { rows: type.defaultRows, columns: type.defaultColumns };
  }
  return null;
}

/**
 * Validate a CSV against the current database and build a write plan, without
 * writing anything. The plan is applied later by `applyPlan`, so a failed
 * import never mutates user data (all-or-nothing, FR-72).
 */
export function planImport(
  db: Db,
  parsed: ParsedCsv,
  mapping: ColumnMapping,
  deps: ImportDeps,
  sourceFilename: string,
): PlanResult {
  const dbFreeIssues = validateRows(parsed, mapping);
  if (dbFreeIssues.length > 0) {
    return { issues: dbFreeIssues, plan: null };
  }

  const containerTypes = new Map(listContainerTypes(db).map((t) => [t.name, t]));
  const itemTypes = new Map(listItemTypes(db).map((t) => [t.name, t]));
  const containerById = new Map<Ulid, Container>();
  const containerByKey = new Map<string, Ulid>();
  for (const container of listContainers(db)) {
    containerById.set(container.id, container);
    containerByKey.set(containerKey(container.parentId, container.name), container.id);
  }
  const codes = new Set(listItems(db).map((item) => item.code));
  const plannedPositions = new Map<Ulid, Map<string, Ulid>>();

  const ops: PlanOp[] = [];
  const issues: ImportIssue[] = [];
  let createdContainers = 0;

  const ensureContainerType = (name: string): ContainerType => {
    const existing = containerTypes.get(name);
    if (existing) {
      return existing;
    }
    const type: ContainerType = { id: deps.newId(), name, canHaveGrid: false, sortOrder: 1000 };
    containerTypes.set(name, type);
    ops.push({ kind: 'containerType', type });
    return type;
  };

  const ensureItemType = (name: string): ItemType => {
    const existing = itemTypes.get(name);
    if (existing) {
      return existing;
    }
    const type: ItemType = { id: deps.newId(), name, requiresQuantity: false };
    itemTypes.set(name, type);
    ops.push({ kind: 'itemType', type });
    return type;
  };

  const resolveLeafContainer = (path: string, leafTypeName: string | undefined): Ulid | null => {
    const segments = path.split('/').map((s) => s.trim()).filter((s) => s !== '');
    if (segments.length === 0) {
      return null;
    }
    let parentId: Ulid | null = null;
    for (let i = 0; i < segments.length; i++) {
      const name = segments[i]!;
      const isLeaf = i === segments.length - 1;
      const key = containerKey(parentId, name);
      const existingId = containerByKey.get(key);
      if (existingId !== undefined) {
        parentId = existingId;
        continue;
      }

      const typeName = isLeaf && leafTypeName ? leafTypeName : 'Shelf';
      const type = ensureContainerType(typeName);
      const grid = gridFromType(type);
      const container: Container = {
        id: deps.newId(),
        code: null,
        name,
        containerTypeId: type.id,
        parentId,
        gridRows: grid?.rows ?? null,
        gridColumns: grid?.columns ?? null,
        rowLabelScheme: 'alpha',
        columnLabelScheme: 'numeric',
        temperatureC: null,
        notes: null,
        status: 'active',
        createdAt: deps.now(),
        updatedAt: deps.now(),
      };
      containerById.set(container.id, container);
      containerByKey.set(key, container.id);
      ops.push({ kind: 'container', container });
      createdContainers++;

      if (grid) {
        const positions = materializePositions(grid.rows, grid.columns, 'alpha', 'numeric').map(
          (p): Position => ({
            id: deps.newId(),
            containerId: container.id,
            rowIndex: p.rowIndex,
            columnIndex: p.columnIndex,
            label: p.label,
          }),
        );
        ops.push({ kind: 'positions', positions });
        const byKey = new Map<string, Ulid>();
        for (const position of positions) {
          byKey.set(positionKey(position.rowIndex, position.columnIndex), position.id);
        }
        plannedPositions.set(container.id, byKey);
      }

      parentId = container.id;
    }
    return parentId;
  };

  const resolvePosition = (leafContainerId: Ulid, label: string, row: number): Ulid | null => {
    const container = containerById.get(leafContainerId);
    if (!container || container.gridRows === null || container.gridColumns === null) {
      issues.push({
        row,
        column: headerFor(mapping, 'position'),
        reason: 'position provided but the container is not a grid',
      });
      return null;
    }
    const parsed = parsePositionLabel(label, container.rowLabelScheme, container.columnLabelScheme);
    if (!parsed) {
      issues.push({
        row,
        column: headerFor(mapping, 'position'),
        reason: `cannot interpret position label "${label}"`,
      });
      return null;
    }
    if (!positionIsWithinBounds(container, parsed.rowIndex, parsed.columnIndex)) {
      issues.push({
        row,
        column: headerFor(mapping, 'position'),
        reason: `position "${label}" is outside the ${container.gridRows}×${container.gridColumns} grid`,
      });
      return null;
    }
    const planned = plannedPositions.get(leafContainerId);
    if (planned) {
      return planned.get(positionKey(parsed.rowIndex, parsed.columnIndex)) ?? null;
    }
    return findPosition(db, leafContainerId, parsed.rowIndex, parsed.columnIndex)?.id ?? null;
  };

  const batchId = deps.newId();
  const importedEvents: { item: Item; event: Event }[] = [];

  for (const row of parsed.rows) {
    const values = extractRowValues(parsed.headers, row.fields, mapping);
    if (Object.values(values).every((v) => v === undefined || v === '')) {
      continue;
    }

    const code = values.code!.trim();
    if (codes.has(code)) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'code'),
        reason: `code "${code}" already exists in the database`,
      });
      continue;
    }
    codes.add(code);

    let containerId: Ulid | null = null;
    let positionId: Ulid | null = null;
    const path = values.containerPath?.trim();
    if (path) {
      const leaf = resolveLeafContainer(path, values.containerType?.trim() || undefined);
      containerId = leaf;
      if (leaf !== null && values.position && values.position.trim() !== '') {
        positionId = resolvePosition(leaf, values.position.trim(), row.rowNumber);
      }
    }

    const itemTypeName = values.itemType?.trim() || 'Specimen';
    const itemType = ensureItemType(itemTypeName);

    const collectedAt = values.collectedAt ? (parsePartialDate(values.collectedAt) ?? undefined) : undefined;
    const quantityValue =
      values.quantityValue && values.quantityValue.trim() !== '' ? Number(values.quantityValue) : undefined;
    const quantityUnit = values.quantityUnit?.trim() || undefined;
    const latitude = values.latitude && values.latitude.trim() !== '' ? Number(values.latitude) : undefined;
    const longitude = values.longitude && values.longitude.trim() !== '' ? Number(values.longitude) : undefined;

    const now = deps.now();
    const item: Item = {
      id: deps.newId(),
      code,
      name: values.name?.trim() || code,
      itemTypeId: itemType.id,
      status: (values.status?.trim() || 'active') as ItemStatus,
      containerId,
      positionId,
      quantity: quantityValue !== undefined && quantityUnit ? { value: quantityValue, unit: quantityUnit } : undefined,
      collectedAt,
      collectedBy: values.collectedBy?.trim() || undefined,
      localityText: values.locality?.trim() || undefined,
      coordinates:
        latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined,
      notes: values.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const event = createEvent({
      id: deps.newId(),
      occurredAt: now,
      recordedAt: now,
      actorName: deps.actorName,
      subjectKind: 'item',
      subjectId: item.id,
      type: 'imported',
      note: sourceFilename,
      batchId,
    });

    importedEvents.push({ item, event });
  }

  if (issues.length > 0) {
    return { issues, plan: null };
  }

  for (const { item, event } of importedEvents) {
    ops.push({ kind: 'item', item, event });
  }

  const plan: Plan = {
    ops,
    importedCount: importedEvents.length,
    createdContainers,
    importBatch: {
      id: deps.newId(),
      batchId,
      sourceFilename,
      rowCount: importedEvents.length,
      mapping: JSON.stringify(mapping),
      importedAt: deps.now(),
    },
  };
  return { issues: [], plan };
}

/** Apply a validated plan inside a single transaction. */
export function applyPlan(db: Db, plan: Plan): void {
  const apply = db.transaction(() => {
    for (const op of plan.ops) {
      switch (op.kind) {
        case 'containerType':
          insertContainerType(db, op.type);
          break;
        case 'itemType':
          insertItemType(db, op.type);
          break;
        case 'container':
          insertContainer(db, op.container);
          break;
        case 'positions':
          insertPositions(db, op.positions);
          break;
        case 'item':
          insertItem(db, op.item);
          insertEvent(db, op.event);
          break;
      }
    }
    insertImportBatch(db, plan.importBatch);
  });
  apply();
}
