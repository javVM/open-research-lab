import type { Event, ImportBatch, Ulid } from '@sample-operations/core';
import type { Db } from './db-types.js';

interface EventRow {
  id: string;
  occurred_at: string;
  recorded_at: string;
  actor_name: string;
  subject_kind: 'item' | 'container';
  subject_id: string;
  type: Event['type'];
  from_json: string | null;
  to_json: string | null;
  note: string | null;
  batch_id: string | null;
}

interface ImportBatchRow {
  id: string;
  batch_id: string;
  source_filename: string;
  row_count: number;
  mapping: string;
  imported_at: string;
}

function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
    actorName: row.actor_name,
    subjectKind: row.subject_kind,
    subjectId: row.subject_id,
    type: row.type,
    fromJson: row.from_json,
    toJson: row.to_json,
    note: row.note,
    batchId: row.batch_id,
  };
}

function toImportBatch(row: ImportBatchRow): ImportBatch {
  return {
    id: row.id,
    batchId: row.batch_id,
    sourceFilename: row.source_filename,
    rowCount: row.row_count,
    mapping: row.mapping,
    importedAt: row.imported_at,
  };
}

export function insertEvent(db: Db, event: Event): void {
  db.prepare(
    `INSERT INTO event (id, occurred_at, recorded_at, actor_name, subject_kind, subject_id, type,
                        from_json, to_json, note, batch_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    event.id,
    event.occurredAt,
    event.recordedAt,
    event.actorName,
    event.subjectKind,
    event.subjectId,
    event.type,
    event.fromJson ?? null,
    event.toJson ?? null,
    event.note ?? null,
    event.batchId ?? null,
  );
}

export function listEventsForSubject(db: Db, subjectKind: 'item' | 'container', subjectId: Ulid): Event[] {
  const rows = db
    .prepare('SELECT * FROM event WHERE subject_kind = ? AND subject_id = ? ORDER BY occurred_at, id')
    .all(subjectKind, subjectId) as EventRow[];
  return rows.map(toEvent);
}

export function listEvents(db: Db): Event[] {
  const rows = db.prepare('SELECT * FROM event ORDER BY occurred_at, id').all() as EventRow[];
  return rows.map(toEvent);
}

export function insertImportBatch(db: Db, batch: ImportBatch): void {
  db.prepare(
    'INSERT INTO import_batch (id, batch_id, source_filename, row_count, mapping, imported_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    batch.id,
    batch.batchId,
    batch.sourceFilename,
    batch.rowCount,
    batch.mapping,
    batch.importedAt,
  );
}

export function listImportBatches(db: Db): ImportBatch[] {
  const rows = db.prepare('SELECT * FROM import_batch ORDER BY imported_at').all() as ImportBatchRow[];
  return rows.map(toImportBatch);
}
