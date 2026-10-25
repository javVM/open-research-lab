import Database from 'better-sqlite3';
import { migrate } from './migrations.js';

/**
 * Open (or create) the SQLite database and bring the schema current (ADR-0002,
 * ADR-0005). WAL + foreign keys are enabled before any statement runs.
 */
export function openDatabase(path: string): Database.Database {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  if (path !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  migrate(db);
  return db;
}
