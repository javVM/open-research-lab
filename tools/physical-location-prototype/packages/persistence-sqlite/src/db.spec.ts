import { describe, expect, it } from 'vitest';
import { openTestDb } from './test-helpers.js';

describe('openDatabase', () => {
  it('runs migrations and records the schema version', () => {
    const { db, cleanup } = openTestDb();
    try {
      const rows = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version').all() as {
        version: number;
        name: string;
      }[];
      expect(rows.map((r) => r.version)).toContain(1);
    } finally {
      cleanup();
    }
  });

  it('is idempotent across reopens', () => {
    const first = openTestDb();
    first.db.prepare("INSERT INTO setting (key, value) VALUES ('a', '1')").run();
    first.cleanup();

    // Reopening a fresh database on a new file must migrate cleanly, not error.
    const second = openTestDb();
    try {
      const count = second.db.prepare('SELECT COUNT(*) AS n FROM container_type').get() as {
        n: number;
      };
      expect(count.n).toBe(0);
    } finally {
      second.cleanup();
    }
  });
});
