import type { Dataset } from './models';
import {
  historyOf,
  itemCountIncludingDescendants,
  itemCountsByLocation,
  itemsAtLocation,
  searchItems,
  whereIs,
} from './search';

function dataset(): Dataset {
  return {
    locations: [
      { id: 'building', parentId: null, name: 'Building A', type: 'building' },
      { id: 'drawer', parentId: 'building', name: 'Drawer 01', type: 'drawer' },
      { id: 'tray', parentId: 'drawer', name: 'Tray 01', type: 'tray' },
      { id: 'pos-a1', parentId: 'tray', name: 'A01', type: 'position', row: 1, column: 1 },
    ],
    items: [
      { id: 'item-1', catalogueNumber: 'MNCN-0001', label: 'Mammoth mandible', locationId: 'pos-a1', status: 'active' },
      { id: 'item-2', catalogueNumber: 'PALEO-0001', label: 'Trilobite plate', locationId: null, status: 'lost' },
    ],
    movements: [
      { id: 'mov-1', itemId: 'item-1', fromLocationId: null, toLocationId: 'drawer', occurredAt: '2026-01-01T00:00:00.000Z' },
      { id: 'mov-2', itemId: 'item-1', fromLocationId: 'drawer', toLocationId: 'pos-a1', occurredAt: '2026-02-01T00:00:00.000Z' },
    ],
  };
}

describe('whereIs', () => {
  it('returns the item and its breadcrumb when located', () => {
    const result = whereIs(dataset(), 'item-1');
    expect(result?.breadcrumb.map((l) => l.name)).toEqual(['Building A', 'Drawer 01', 'Tray 01', 'A01']);
  });

  it('returns undefined for an unlocated item', () => {
    expect(whereIs(dataset(), 'item-2')).toBeUndefined();
  });

  it('returns undefined for an unknown item', () => {
    expect(whereIs(dataset(), 'nope')).toBeUndefined();
  });
});

describe('itemsAtLocation', () => {
  it('finds items whose locationId matches exactly', () => {
    expect(itemsAtLocation(dataset(), 'pos-a1').map((i) => i.id)).toEqual(['item-1']);
    expect(itemsAtLocation(dataset(), 'drawer')).toEqual([]);
  });
});

describe('itemCountIncludingDescendants', () => {
  it('counts items at a location and everywhere below it', () => {
    expect(itemCountIncludingDescendants(dataset(), 'building')).toBe(1);
    expect(itemCountIncludingDescendants(dataset(), 'drawer')).toBe(1);
    expect(itemCountIncludingDescendants(dataset(), 'pos-a1')).toBe(1);
  });
});

describe('itemCountsByLocation', () => {
  it('matches itemCountIncludingDescendants for every location, computed in one pass', () => {
    const ds = dataset();
    const batch = itemCountsByLocation(ds);
    for (const location of ds.locations) {
      expect(batch.get(location.id)).toBe(itemCountIncludingDescendants(ds, location.id));
    }
  });

  it('gives locations with no items a count of zero rather than being absent', () => {
    const ds: Dataset = { ...dataset(), items: [] };
    const batch = itemCountsByLocation(ds);
    expect(batch.get('building')).toBe(0);
    expect(batch.get('pos-a1')).toBe(0);
  });
});

describe('historyOf', () => {
  it('returns movements for the item, oldest first', () => {
    const history = historyOf(dataset(), 'item-1');
    expect(history.map((m) => m.id)).toEqual(['mov-1', 'mov-2']);
  });

  it('is empty for an item with no movements', () => {
    expect(historyOf(dataset(), 'item-2')).toEqual([]);
  });
});

describe('searchItems', () => {
  it('matches by catalogue number, case-insensitively', () => {
    expect(searchItems(dataset(), 'mncn-0001').map((i) => i.id)).toEqual(['item-1']);
  });

  it('matches by label', () => {
    expect(searchItems(dataset(), 'trilobite').map((i) => i.id)).toEqual(['item-2']);
  });

  it('returns an empty array for a blank query', () => {
    expect(searchItems(dataset(), '   ')).toEqual([]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchItems(dataset(), 'zzz')).toEqual([]);
  });
});
