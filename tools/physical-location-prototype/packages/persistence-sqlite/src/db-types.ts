import type Database from 'better-sqlite3';

/** The better-sqlite3 instance type, aliased for readability across repositories. */
export type Db = InstanceType<typeof Database>;
