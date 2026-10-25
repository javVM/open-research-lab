import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type Database from 'better-sqlite3';
import { openDatabase } from './db.js';
import { findContainerTypeByName, seedContainerTypes } from './containers.js';
import { findItemTypeByName, seedItemTypes } from './items.js';

export type Db = InstanceType<typeof Database>;

/** Open a database against a real temporary file, not an in-memory mock. */
export function openTestDb(): { db: Db; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'sample-ops-'));
  const path = join(dir, 'test.sqlite');
  const db = openDatabase(path);
  return {
    db,
    cleanup: () => {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** A deterministic ULID generator for tests (26 chars, colliding only if reused). */
export function testIdFactory(prefix = 'test'): () => string {
  let counter = 0;
  return () => {
    const body = `${prefix}${String(counter++).padStart(6, '0')}`;
    return body.padEnd(26, '0');
  };
}

/** Seed default vocabularies and hand back the ids tests need to build FK-valid rows. */
export function setupFixture(db: Db) {
  const newId = testIdFactory('fx');
  seedContainerTypes(db);
  seedItemTypes(db, newId);
  return {
    newId,
    boxTypeId: findContainerTypeByName(db, 'Box')!.id,
    siteTypeId: findContainerTypeByName(db, 'Site')!.id,
    specimenTypeId: findItemTypeByName(db, 'Specimen')!.id,
    sampleTypeId: findItemTypeByName(db, 'Sample')!.id,
  };
}
