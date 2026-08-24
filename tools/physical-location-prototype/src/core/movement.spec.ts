import type { Dataset } from './models';
import { move } from './movement';

function dataset(): Dataset {
  return {
    locations: [
      { id: 'drawer', parentId: null, name: 'Drawer 01', type: 'drawer' },
      { id: 'tray', parentId: 'drawer', name: 'Tray 01', type: 'tray' },
      { id: 'pos-a1', parentId: 'tray', name: 'A01', type: 'position', row: 1, column: 1 },
      { id: 'pos-a2', parentId: 'tray', name: 'A02', type: 'position', row: 1, column: 2 },
    ],
    items: [
      { id: 'item-1', catalogueNumber: 'MNCN-0001', locationId: 'pos-a1', status: 'active' },
      { id: 'item-2', catalogueNumber: 'MNCN-0002', locationId: null, status: 'active' },
    ],
    movements: [],
  };
}

describe('move', () => {
  it('moves an unlocated item into an empty position', () => {
    const result = move(dataset(), 'item-2', 'pos-a2', '2026-08-24T00:00:00.000Z', 'Accessioned');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.items.find((i) => i.id === 'item-2')?.locationId).toBe('pos-a2');
      expect(result.movement).toMatchObject({
        itemId: 'item-2',
        fromLocationId: null,
        toLocationId: 'pos-a2',
        note: 'Accessioned',
      });
    }
  });

  it('records a movement with the previous location as "from"', () => {
    const result = move(dataset(), 'item-1', 'pos-a2', '2026-08-24T00:00:00.000Z');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.movement.fromLocationId).toBe('pos-a1');
      expect(result.movement.toLocationId).toBe('pos-a2');
    }
  });

  it('refuses to move an item onto an already-occupied position', () => {
    const withBoth = move(dataset(), 'item-2', 'pos-a1', '2026-08-24T00:00:00.000Z');
    expect(withBoth.ok).toBe(false);
    if (!withBoth.ok) {
      expect(withBoth.error).toContain('already occupied');
    }
  });

  it('allows an item to be cleared to no location', () => {
    const result = move(dataset(), 'item-1', null, '2026-08-24T00:00:00.000Z', 'Checked out');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dataset.items.find((i) => i.id === 'item-1')?.locationId).toBeNull();
    }
  });

  it('rejects an unknown item id', () => {
    const result = move(dataset(), 'nope', 'pos-a2', '2026-08-24T00:00:00.000Z');
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown destination location id', () => {
    const result = move(dataset(), 'item-2', 'nope', '2026-08-24T00:00:00.000Z');
    expect(result.ok).toBe(false);
  });

  it('allows multiple items directly in a non-position location (e.g. a drawer)', () => {
    const first = move(dataset(), 'item-2', 'drawer', '2026-08-24T00:00:00.000Z');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = move(first.dataset, 'item-1', 'drawer', '2026-08-24T00:00:00.000Z');
    expect(second.ok).toBe(true);
    if (second.ok) {
      const atDrawer = second.dataset.items.filter((item) => item.locationId === 'drawer');
      expect(atDrawer).toHaveLength(2);
    }
  });
});
