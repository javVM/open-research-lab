import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  listContainers,
  listEvents,
  listImportBatches,
  listItems,
  nodeUlidSource,
  openDatabase,
  seedContainerTypes,
  seedItemTypes,
  type Db,
} from '@sample-operations/persistence-sqlite';
import { newUlid } from '@sample-operations/core';
import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.js';
import { resolveMapping } from './fields.js';
import { applyPlan, planImport, type ImportDeps } from './import.js';

function openTempDb(): { db: Db; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'sample-ops-cli-'));
  const db = openDatabase(join(dir, 'test.sqlite'));
  return {
    db,
    cleanup: () => {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function deterministicIdFactory(): () => string {
  let counter = 0;
  return () => `test${String(counter++).padStart(6, '0')}`.padEnd(26, '0');
}

function importCsv(db: Db, text: string) {
  const newId = deterministicIdFactory();
  const deps: ImportDeps = { newId, now: () => '2026-01-01T00:00:00.000Z', actorName: 'Test' };
  const parsed = parseCsv(text);
  const mapping = resolveMapping(parsed.headers);
  const result = planImport(db, parsed, mapping, deps, 'test.csv');
  if (result.plan) {
    applyPlan(db, result.plan);
  }
  return result;
}

describe('import', () => {
  it('imports items and creates containers from paths, writing events and a batch', () => {
    const { db, cleanup } = openTempDb();
    try {
      seedContainerTypes(db);
      seedItemTypes(db, () => newUlid(nodeUlidSource));

      const result = importCsv(
        db,
        'code,name,containerPath\nPAL-1,Specimen one,Store 2 / Cabinet 4 / Drawer 12\n',
      );
      expect(result.issues).toEqual([]);

      const items = listItems(db);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ code: 'PAL-1', name: 'Specimen one', status: 'active' });

      const containers = listContainers(db);
      expect(containers.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Store 2', 'Cabinet 4', 'Drawer 12']),
      );

      expect(listEvents(db).filter((e) => e.type === 'imported')).toHaveLength(1);
      expect(listImportBatches(db)).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  it('assigns a position within a grid container, tolerating zero-padding', () => {
    const { db, cleanup } = openTempDb();
    try {
      seedContainerTypes(db);
      seedItemTypes(db, () => newUlid(nodeUlidSource));

      const result = importCsv(
        db,
        'code,containerPath,containerType,position\nMB-1,Freezer 1 / Box 7,Box,C04\n',
      );
      expect(result.issues).toEqual([]);

      const item = listItems(db)[0]!;
      expect(item.positionId).not.toBeNull();
    } finally {
      cleanup();
    }
  });

  it('reports a position outside the grid without writing anything', () => {
    const { db, cleanup } = openTempDb();
    try {
      seedContainerTypes(db);
      seedItemTypes(db, () => newUlid(nodeUlidSource));

      const result = importCsv(
        db,
        'code,containerPath,containerType,position\nMB-1,Freezer 1 / Box 7,Box,Z99\n',
      );
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]!.reason).toMatch(/outside the 9×9 grid/);
      expect(listItems(db)).toHaveLength(0);
    } finally {
      cleanup();
    }
  });

  it('rejects a code that already exists in the database', () => {
    const { db, cleanup } = openTempDb();
    try {
      seedContainerTypes(db);
      seedItemTypes(db, () => newUlid(nodeUlidSource));

      expect(importCsv(db, 'code\nDUP-1\n').issues).toEqual([]);
      const second = importCsv(db, 'code\nDUP-1\n');
      expect(second.issues[0]!.reason).toMatch(/already exists/);
      expect(listItems(db)).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  it('shares one container tree across rows that repeat the same path', () => {
    const { db, cleanup } = openTempDb();
    try {
      seedContainerTypes(db);
      seedItemTypes(db, () => newUlid(nodeUlidSource));

      const result = importCsv(
        db,
        'code,containerPath\nA1,Store / Cabinet\nA2,Store / Cabinet\n',
      );
      expect(result.issues).toEqual([]);
      expect(listContainers(db)).toHaveLength(2);
      expect(listItems(db)).toHaveLength(2);
    } finally {
      cleanup();
    }
  });
});
