import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newUlid } from '@sample-operations/core';
import {
  listItems,
  nodeUlidSource,
  openDatabase,
  seedContainerTypes,
  seedItemTypes,
  type Db,
} from '@sample-operations/persistence-sqlite';
import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.js';
import { exportItemsCsv } from './export.js';
import { resolveMapping } from './fields.js';
import { applyPlan, planImport, type ImportDeps } from './import.js';

function openTempDb(): { db: Db; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'sample-ops-exp-'));
  const db = openDatabase(join(dir, 'test.sqlite'));
  return {
    db,
    cleanup: () => {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function seed(db: Db): void {
  seedContainerTypes(db);
  seedItemTypes(db, () => newUlid(nodeUlidSource));
}

function importText(db: Db, text: string): void {
  const newId = (() => {
    let n = 0;
    return () => `test${String(n++).padStart(6, '0')}`.padEnd(26, '0');
  })();
  const deps: ImportDeps = { newId, now: () => '2026-01-01T00:00:00.000Z', actorName: 'Test' };
  const parsed = parseCsv(text);
  const result = planImport(db, parsed, resolveMapping(parsed.headers), deps, 'test.csv');
  if (result.issues.length > 0 || !result.plan) {
    throw new Error(`unexpected import issues: ${JSON.stringify(result.issues)}`);
  }
  applyPlan(db, result.plan);
}

describe('export', () => {
  it('round-trips: export then re-import reproduces the same items', () => {
    const { db, cleanup } = openTempDb();
    try {
      seed(db);
      importText(
        db,
        'code,name,itemType,containerPath,containerType,position,quantityValue,quantityUnit,collectedAt,locality\n' +
          'MB-0001,Extract,Sample,Lab A / Freezer 1 / Box 3,Box,C4,50,µL,1998-07,Las Hoyas\n',
      );

      const csv = exportItemsCsv(db);
      const parsed = parseCsv(csv);

      // Re-import the exported CSV into a fresh database.
      const { db: db2, cleanup: cleanup2 } = openTempDb();
      try {
        seed(db2);
        importText(db2, csv);

        const original = listItems(db)[0]!;
        const roundTripped = listItems(db2)[0]!;
        expect(roundTripped.code).toBe(original.code);
        expect(roundTripped.name).toBe(original.name);
        expect(roundTripped.quantity).toEqual(original.quantity);
        expect(roundTripped.collectedAt).toEqual(original.collectedAt);
        expect(roundTripped.localityText).toBe(original.localityText);
        expect(roundTripped.positionId).not.toBeNull();
      } finally {
        cleanup2();
      }

      expect(parsed.headers).toContain('code');
    } finally {
      cleanup();
    }
  });
});
