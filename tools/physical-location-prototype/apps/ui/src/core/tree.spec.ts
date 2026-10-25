import { ancestorIds, breadcrumb, breadcrumbLabel, buildTree, childrenOf, descendantIds } from './tree';
import type { Location } from './models';

function loc(id: string, parentId: string | null, name: string, type: Location['type'] = 'room'): Location {
  return { id, parentId, name, type };
}

const locations: Location[] = [
  loc('building', null, 'Building A', 'building'),
  loc('room', 'building', 'Room 1', 'room'),
  loc('cabinet', 'room', 'Cabinet 01', 'cabinet'),
  loc('drawer', 'cabinet', 'Drawer 01', 'drawer'),
];

describe('buildTree', () => {
  it('builds a nested hierarchy from a flat location list', () => {
    const tree = buildTree(locations);
    expect(tree).toHaveLength(1);
    expect(tree[0].location.id).toBe('building');
    expect(tree[0].children[0].location.id).toBe('room');
    expect(tree[0].children[0].children[0].location.id).toBe('cabinet');
    expect(tree[0].children[0].children[0].children[0].location.id).toBe('drawer');
  });
});

describe('childrenOf', () => {
  it('returns only direct children, sorted by name', () => {
    const children = childrenOf(
      [...locations, loc('cabinet2', 'room', 'Cabinet 02', 'cabinet')],
      'room',
    );
    expect(children.map((c) => c.id)).toEqual(['cabinet', 'cabinet2']);
  });
});

describe('breadcrumb', () => {
  it('returns the path from root to the given location, inclusive', () => {
    const path = breadcrumb(locations, 'drawer');
    expect(path.map((l) => l.name)).toEqual(['Building A', 'Room 1', 'Cabinet 01', 'Drawer 01']);
  });

  it('throws for an unknown location id', () => {
    expect(() => breadcrumb(locations, 'nope')).toThrow('Unknown location id');
  });
});

describe('breadcrumbLabel', () => {
  it('joins the path with " / "', () => {
    expect(breadcrumbLabel(locations, 'cabinet')).toBe('Building A / Room 1 / Cabinet 01');
  });
});

describe('ancestorIds', () => {
  it('excludes the location itself', () => {
    expect(ancestorIds(locations, 'drawer')).toEqual(['building', 'room', 'cabinet']);
  });

  it('is empty for a root location', () => {
    expect(ancestorIds(locations, 'building')).toEqual([]);
  });
});

describe('descendantIds', () => {
  it('returns every id below the given location', () => {
    expect(descendantIds(locations, 'building').sort()).toEqual(['cabinet', 'drawer', 'room']);
  });

  it('is empty for a leaf', () => {
    expect(descendantIds(locations, 'drawer')).toEqual([]);
  });
});
