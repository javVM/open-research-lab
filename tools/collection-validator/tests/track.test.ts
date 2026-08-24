import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  createLocation,
  createStore,
  exportState,
  findItemByExternalId,
  historyOf,
  importCatalogueCsv,
  importState,
  moveItem,
  whereIs,
} from '../src/track.ts';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/track/${name}`, import.meta.url));

function readFixture(name: string): string {
  return readFileSync(fixture(name), 'utf8');
}

test('the smallest possible start needs only a catalogue number', () => {
  const store = createStore();
  importCatalogueCsv(store, readFixture('minimal.csv'));

  assert.equal(store.items.size, 3);
  assert.ok(findItemByExternalId(store, 'ABC-001'));
  assert.ok(findItemByExternalId(store, 'ABC-002'));
  assert.ok(findItemByExternalId(store, 'ABC-003'));

  for (const item of store.items.values()) {
    assert.equal(item.currentLocationId, null);
    assert.equal(item.importedLocation, null);
    assert.equal(item.label, null);
  }
});

test('a public-derived CSV with many irrelevant columns imports only id, label and an optional location', () => {
  const store = createStore();
  importCatalogueCsv(store, readFixture('public-derived.csv'));

  assert.equal(store.items.size, 6);

  const first = findItemByExternalId(store, 'MNCN-101');
  if (first === undefined) assert.fail('MNCN-101 was not imported');
  assert.equal(first.label, 'Blue morpho');
  assert.equal(first.importedLocation, 'MNH-ZOO-DR-01');
  assert.equal(first.currentLocationId, null);
});

test('end-to-end physical tracking workflow: create, move, query and round-trip', () => {
  const store = createStore();
  importCatalogueCsv(store, readFixture('public-derived.csv'));

  const building = createLocation(store, 'building', 'Main Building');
  const room = createLocation(store, 'room', 'Room 101', building.id);
  const cabinet = createLocation(store, 'cabinet', 'Cabinet A', room.id);
  const drawer = createLocation(store, 'drawer', 'Drawer 3', cabinet.id);
  const tray = createLocation(store, 'tray', 'Tray 1', drawer.id);
  const workArea = createLocation(store, 'work-area', 'Prep Bench', room.id);

  const items = Array.from(store.items.values());
  const subject = items[0];
  if (subject === undefined) assert.fail('no items were imported');

  for (const item of items.slice(0, 3)) {
    moveItem(
      store,
      item.id,
      tray.id,
      'J. Doe',
      '2026-08-24T09:00:00Z',
      'initial placement',
    );
  }

  const atTray = whereIs(store, subject.externalId);
  assert.equal(atTray.location?.name, 'Tray 1');
  assert.equal(atTray.previousLocation, null);

  moveItem(
    store,
    subject.id,
    workArea.id,
    'J. Doe',
    '2026-08-24T10:00:00Z',
    'taken for preparation',
  );

  const atWork = whereIs(store, subject.externalId);
  assert.equal(atWork.location?.name, 'Prep Bench');
  assert.equal(atWork.previousLocation?.name, 'Tray 1');
  assert.equal(atWork.lastMovement?.actor, 'J. Doe');

  moveItem(
    store,
    subject.id,
    tray.id,
    'A. Smith',
    '2026-08-24T11:00:00Z',
    'returned after preparation',
  );

  const back = whereIs(store, subject.externalId);
  assert.equal(back.location?.name, 'Tray 1');
  assert.equal(back.previousLocation?.name, 'Prep Bench');
  assert.equal(back.lastMovement?.actor, 'A. Smith');

  const history = historyOf(store, subject.externalId);
  assert.equal(history.length, 3);
  assert.equal(history[1]?.note, 'taken for preparation');

  const json = exportState(store);
  const fresh = importState(json);

  assert.equal(fresh.items.size, store.items.size);
  assert.equal(fresh.locations.size, store.locations.size);
  assert.equal(fresh.movements.length, store.movements.length);

  const subject2 = findItemByExternalId(fresh, subject.externalId);
  if (subject2 === undefined) assert.fail('subject not preserved after import');
  assert.equal(subject2.currentLocationId, subject.currentLocationId);
  assert.equal(subject2.label, subject.label);
  assert.equal(subject2.importedLocation, subject.importedLocation);

  assert.equal(
    historyOf(fresh, subject2.externalId).length,
    historyOf(store, subject.externalId).length,
  );
  assert.equal(whereIs(fresh, subject2.externalId).location?.name, 'Tray 1');
});
