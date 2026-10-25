import { describe, expect, it } from 'vitest';
import { insertEvent, listEventsForSubject, listEvents } from './events.js';
import { openTestDb, testIdFactory } from './test-helpers.js';
import type { Event } from '@sample-operations/core';

const newId = testIdFactory('e');

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: newId(),
    occurredAt: '2026-01-01T00:00:00.000Z',
    recordedAt: '2026-01-01T00:00:00.000Z',
    actorName: 'A. López',
    subjectKind: 'item',
    subjectId: 'i1',
    type: 'moved',
    ...overrides,
  };
}

describe('events', () => {
  it('round-trips an event and lists by subject', () => {
    const { db, cleanup } = openTestDb();
    try {
      insertEvent(db, event());
      insertEvent(db, event({ subjectId: 'i2', type: 'created' }));
      expect(listEventsForSubject(db, 'item', 'i1')).toHaveLength(1);
      expect(listEvents(db)).toHaveLength(2);
    } finally {
      cleanup();
    }
  });

  it('refuses to update an event (append-only, invariant 6)', () => {
    const { db, cleanup } = openTestDb();
    try {
      const ev = event();
      insertEvent(db, ev);
      expect(() =>
        db.prepare('UPDATE event SET note = ? WHERE id = ?').run('tampered', ev.id),
      ).toThrow(/append-only/);
    } finally {
      cleanup();
    }
  });

  it('refuses to delete an event (append-only, invariant 6)', () => {
    const { db, cleanup } = openTestDb();
    try {
      const ev = event();
      insertEvent(db, ev);
      expect(() => db.prepare('DELETE FROM event WHERE id = ?').run(ev.id)).toThrow(/append-only/);
    } finally {
      cleanup();
    }
  });
});
