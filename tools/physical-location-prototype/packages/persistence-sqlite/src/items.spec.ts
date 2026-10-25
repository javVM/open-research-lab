import { describe, expect, it } from 'vitest';
import { findItemByCode, getItem, insertItem, listItemTypes, seedItemTypes } from './items.js';
import { insertContainer, insertPositions } from './containers.js';
import { openTestDb, setupFixture, testIdFactory } from './test-helpers.js';
import type { Item } from '@sample-operations/core';

const newId = testIdFactory('i');

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: newId(),
    code: 'MB-0001',
    name: 'Extract',
    itemTypeId: 'it-sample',
    status: 'active',
    containerId: null,
    positionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('item types', () => {
  it('seeds the default vocabulary idempotently', () => {
    const { db, cleanup } = openTestDb();
    try {
      seedItemTypes(db, testIdFactory('it'));
      seedItemTypes(db, testIdFactory('it'));
      const types = listItemTypes(db);
      expect(types.map((t) => t.name)).toContain('Specimen');
      expect(types.find((t) => t.name === 'Sample')?.requiresQuantity).toBe(true);
    } finally {
      cleanup();
    }
  });
});

describe('items', () => {
  it('round-trips an item with quantity, date and coordinates', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { specimenTypeId } = setupFixture(db);
      const full = item({
        itemTypeId: specimenTypeId,
        quantity: { value: 50, unit: 'µL' },
        collectedAt: { verbatim: '1998-07', year: 1998, month: 7, precision: 'month' },
        localityText: 'Las Hoyas, Cuenca, Spain',
        coordinates: { latitude: 40.1, longitude: -2.0, uncertaintyMeters: 100 },
      });
      insertItem(db, full);
      expect(getItem(db, full.id)).toEqual(full);
    } finally {
      cleanup();
    }
  });

  it('rejects a quantity value with no unit at the database level', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { specimenTypeId } = setupFixture(db);
      expect(() =>
        db
          .prepare(
            `INSERT INTO item (id, code, name, item_type_id, status, quantity_value, quantity_unit,
                               created_at, updated_at)
             VALUES (?, ?, ?, ?, 'active', 50, NULL, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`,
          )
          .run(newId(), 'X-1', 'X', specimenTypeId),
      ).toThrow();
    } finally {
      cleanup();
    }
  });

  it('enforces code uniqueness among non-archived items', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { specimenTypeId } = setupFixture(db);
      insertItem(db, item({ itemTypeId: specimenTypeId, code: 'DUP-1' }));
      expect(() => insertItem(db, item({ itemTypeId: specimenTypeId, code: 'DUP-1' }))).toThrow();
    } finally {
      cleanup();
    }
  });

  it('allows an archived item to share a code with an active one', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { specimenTypeId } = setupFixture(db);
      insertItem(db, item({ itemTypeId: specimenTypeId, code: 'REUSED' }));
      insertItem(db, item({ itemTypeId: specimenTypeId, code: 'REUSED', status: 'archived' }));
      expect(findItemByCode(db, 'REUSED')?.status).toBe('active');
    } finally {
      cleanup();
    }
  });

  it('enforces one active item per position', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { boxTypeId, specimenTypeId } = setupFixture(db);
      const grid = {
        id: newId(),
        name: 'Grid',
        parentId: null,
        code: null,
        containerTypeId: boxTypeId,
        gridRows: 2,
        gridColumns: 2,
        rowLabelScheme: 'alpha',
        columnLabelScheme: 'numeric',
        temperatureC: null,
        notes: null,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      } as const;
      insertContainer(db, grid);
      const position = { id: newId(), containerId: grid.id, rowIndex: 1, columnIndex: 1, label: 'A1' };
      insertPositions(db, [position]);

      insertItem(
        db,
        item({ itemTypeId: specimenTypeId, code: 'A', containerId: grid.id, positionId: position.id }),
      );
      expect(() =>
        insertItem(
          db,
          item({ itemTypeId: specimenTypeId, code: 'B', containerId: grid.id, positionId: position.id }),
        ),
      ).toThrow();
    } finally {
      cleanup();
    }
  });
});
