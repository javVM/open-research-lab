import { describe, expect, it } from 'vitest';
import {
  getContainer,
  insertContainer,
  insertPositions,
  listContainerTypes,
  listContainers,
  listPositionsForContainer,
  seedContainerTypes,
  setContainerParent,
} from './containers.js';
import { openTestDb, setupFixture, testIdFactory } from './test-helpers.js';
import type { Container } from '@sample-operations/core';

const newId = testIdFactory('c');

function container(overrides: Partial<Container> = {}): Container {
  return {
    id: newId(),
    name: 'Box 7',
    parentId: null,
    code: null,
    containerTypeId: 'ct-box',
    gridRows: null,
    gridColumns: null,
    rowLabelScheme: 'alpha',
    columnLabelScheme: 'numeric',
    temperatureC: null,
    notes: null,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('container types', () => {
  it('seeds the default vocabulary idempotently', () => {
    const { db, cleanup } = openTestDb();
    try {
      seedContainerTypes(db);
      seedContainerTypes(db);
      const types = listContainerTypes(db);
      expect(types.length).toBeGreaterThanOrEqual(12);
      expect(types.map((t) => t.name)).toContain('Box');
      expect(types.find((t) => t.name === 'Box')?.canHaveGrid).toBe(true);
    } finally {
      cleanup();
    }
  });
});

describe('containers', () => {
  it('round-trips a grid container through insert/get', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { boxTypeId } = setupFixture(db);
      const grid = container({ containerTypeId: boxTypeId, gridRows: 9, gridColumns: 9, temperatureC: -80 });
      insertContainer(db, grid);
      expect(getContainer(db, grid.id)).toEqual(grid);
    } finally {
      cleanup();
    }
  });

  it('updates a parent id', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { boxTypeId } = setupFixture(db);
      const parent = container({ containerTypeId: boxTypeId, name: 'Freezer 1' });
      const child = container({ containerTypeId: boxTypeId, name: 'Box 7' });
      insertContainer(db, parent);
      insertContainer(db, child);
      setContainerParent(db, child.id, parent.id, '2026-01-02T00:00:00.000Z');
      expect(getContainer(db, child.id)?.parentId).toBe(parent.id);
    } finally {
      cleanup();
    }
  });

  it('lists all containers', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { boxTypeId } = setupFixture(db);
      insertContainer(db, container({ containerTypeId: boxTypeId, name: 'A' }));
      insertContainer(db, container({ containerTypeId: boxTypeId, name: 'B' }));
      expect(listContainers(db)).toHaveLength(2);
    } finally {
      cleanup();
    }
  });
});

describe('positions', () => {
  it('round-trips materialised positions', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { boxTypeId } = setupFixture(db);
      const grid = container({ containerTypeId: boxTypeId, gridRows: 2, gridColumns: 2 });
      insertContainer(db, grid);
      insertPositions(db, [
        { id: newId(), containerId: grid.id, rowIndex: 1, columnIndex: 1, label: 'A1' },
        { id: newId(), containerId: grid.id, rowIndex: 1, columnIndex: 2, label: 'A2' },
      ]);
      expect(listPositionsForContainer(db, grid.id).map((p) => p.label)).toEqual(['A1', 'A2']);
    } finally {
      cleanup();
    }
  });

  it('enforces uniqueness of a position within a container', () => {
    const { db, cleanup } = openTestDb();
    try {
      const { boxTypeId } = setupFixture(db);
      const grid = container({ containerTypeId: boxTypeId, gridRows: 2, gridColumns: 2 });
      insertContainer(db, grid);
      insertPositions(db, [
        { id: newId(), containerId: grid.id, rowIndex: 1, columnIndex: 1, label: 'A1' },
      ]);
      expect(() =>
        insertPositions(db, [
          { id: newId(), containerId: grid.id, rowIndex: 1, columnIndex: 1, label: 'A1' },
        ]),
      ).toThrow();
    } finally {
      cleanup();
    }
  });
});
