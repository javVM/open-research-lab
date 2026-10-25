import type { Database } from 'better-sqlite3';
import * as migration0001 from './migrations/0001_init.js';

/**
 * Numbered, forward-only migrations (ADR-0005). Each module exports a `version`
 * and a `sql` string. Add new migrations at the end; never edit an applied one.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  { version: migration0001.version, name: '0001_init', sql: migration0001.sql },
];

const SCHEMA_MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`;

/** Apply every pending migration, each in its own transaction, forward-only. */
export function migrate(db: Database): void {
  db.exec(SCHEMA_MIGRATIONS_TABLE);
  const appliedRows = db
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as { version: number }[];
  const applied = new Set(appliedRows.map((row) => row.version));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) {
      continue;
    }
    const apply = db.transaction(() => {
      db.exec(migration.sql);
      db.prepare(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
      ).run(migration.version, migration.name, new Date().toISOString());
    });
    apply();
  }
}
