import { computeAlarms } from './alarms';
import type { Dataset, Item } from './models';

const NOW = '2026-10-02T12:00:00.000Z';

function item(overrides: Partial<Item>): Item {
  return {
    id: 'item-1',
    catalogueNumber: 'ITEM-0001',
    category: 'item_unprocessed_matrix',
    locationId: null,
    status: 'active',
    ...overrides,
  };
}

function datasetWith(items: Item[]): Dataset {
  return { locations: [], items, movements: [] };
}

describe('computeAlarms', () => {
  it('returns no alarms for an empty dataset', () => {
    expect(computeAlarms(datasetWith([]), NOW)).toEqual([]);
  });

  it('raises an alarm for a checked-out item past its return time', () => {
    const overdue = item({
      status: 'checked_out',
      dueBackAt: '2026-10-01T12:00:00.000Z',
    });
    const alarms = computeAlarms(datasetWith([overdue]), NOW);
    expect(alarms).toHaveLength(1);
    expect(alarms[0]).toMatchObject({
      kind: 'overdue_checkout',
      itemId: 'item-1',
      catalogueNumber: 'ITEM-0001',
      dueBackAt: '2026-10-01T12:00:00.000Z',
    });
  });

  it('does not alarm for a checked-out item whose return time has not passed', () => {
    const future = item({
      status: 'checked_out',
      dueBackAt: '2026-10-03T12:00:00.000Z',
    });
    expect(computeAlarms(datasetWith([future]), NOW)).toEqual([]);
  });

  it('does not alarm for a checked-out item with no return time', () => {
    const indefinite = item({ status: 'checked_out' });
    expect(computeAlarms(datasetWith([indefinite]), NOW)).toEqual([]);
  });

  it('does not alarm for items that are not checked out', () => {
    const active = item({ status: 'active', dueBackAt: '2026-01-01T00:00:00.000Z' });
    const archived = item({ status: 'archived', dueBackAt: '2026-01-01T00:00:00.000Z' });
    expect(computeAlarms(datasetWith([active, archived]), NOW)).toEqual([]);
  });

  it('sorts alarms most overdue first', () => {
    const earlier = item({ id: 'a', status: 'checked_out', dueBackAt: '2026-09-01T00:00:00.000Z' });
    const later = item({ id: 'b', status: 'checked_out', dueBackAt: '2026-10-01T00:00:00.000Z' });
    const alarms = computeAlarms(datasetWith([later, earlier]), NOW);
    expect(alarms.map((alarm) => alarm.itemId)).toEqual(['a', 'b']);
  });

  it('assigns a stable id per item so the same item cannot yield two alarms', () => {
    const overdue = item({ status: 'checked_out', dueBackAt: '2026-09-01T00:00:00.000Z' });
    const first = computeAlarms(datasetWith([overdue]), NOW);
    const second = computeAlarms(datasetWith([overdue]), NOW);
    expect(first[0].id).toBe(second[0].id);
    expect(first[0].id).toBe('alarm:overdue_checkout:item-1');
  });
});
