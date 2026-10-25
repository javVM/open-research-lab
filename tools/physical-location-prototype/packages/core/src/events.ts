import type { Event, EventType, SubjectKind, Ulid } from './model.js';

/**
 * Event construction (ADR-0007). Events are value objects: once created they are
 * append-only and immutable. Factories here only build them; persistence is
 * responsible for writing them in the same transaction as the mutation.
 */

export interface EventDraft {
  id: Ulid;
  occurredAt: string;
  recordedAt: string;
  actorName: string;
  subjectKind: SubjectKind;
  subjectId: Ulid;
  type: EventType;
  fromJson?: string | null;
  toJson?: string | null;
  note?: string | null;
  batchId?: Ulid | null;
}

export function createEvent(draft: EventDraft): Event {
  return {
    id: draft.id,
    occurredAt: draft.occurredAt,
    recordedAt: draft.recordedAt,
    actorName: draft.actorName,
    subjectKind: draft.subjectKind,
    subjectId: draft.subjectId,
    type: draft.type,
    fromJson: draft.fromJson ?? null,
    toJson: draft.toJson ?? null,
    note: draft.note ?? null,
    batchId: draft.batchId ?? null,
  };
}

/** Serialise a value snapshot for an event's `fromJson`/`toJson`. */
export function toJson(value: unknown): string {
  return JSON.stringify(value);
}

/** Parse an event snapshot back into a value; returns `undefined` on malformed input. */
export function fromJson<T>(json: string | null | undefined): T | undefined {
  if (json === null || json === undefined || json === '') {
    return undefined;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}
