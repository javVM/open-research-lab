import { describe, expect, it } from 'vitest';
import {
  ancestorIds,
  fullPathLabel,
  isAncestorOrSelf,
  pathTo,
  wouldCreateCycle,
  type ContainerLookup,
} from './container-tree.js';
import type { Container, Ulid } from './model.js';

function container(id: Ulid, name: string, parentId: Ulid | null): Container {
  return {
    id,
    name,
    parentId,
    code: null,
    containerTypeId: 'ct',
    gridRows: null,
    gridColumns: null,
    rowLabelScheme: 'alpha',
    columnLabelScheme: 'numeric',
    temperatureC: null,
    notes: null,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

// tree: lab -> freezer -> box
const lab = container('lab', 'Lab A', null);
const freezer = container('freezer', 'Freezer 1', 'lab');
const box = container('box', 'Box 7', 'freezer');

function lookup(...containers: Container[]): ContainerLookup {
  const map = new Map(containers.map((c) => [c.id, c]));
  return { get: (id) => map.get(id) };
}

describe('ancestorIds', () => {
  it('returns ancestors from immediate parent up to the root', () => {
    expect(ancestorIds('box', lookup(lab, freezer, box))).toEqual(['freezer', 'lab']);
    expect(ancestorIds('lab', lookup(lab))).toEqual([]);
  });

  it('throws on a cycle', () => {
    const a = container('a', 'A', 'b');
    const b = container('b', 'B', 'a');
    expect(() => ancestorIds('a', lookup(a, b))).toThrow(/cycle/);
  });
});

describe('isAncestorOrSelf / wouldCreateCycle', () => {
  it('detects ancestors and self', () => {
    const l = lookup(lab, freezer, box);
    expect(isAncestorOrSelf('lab', 'box', l)).toBe(true);
    expect(isAncestorOrSelf('freezer', 'box', l)).toBe(true);
    expect(isAncestorOrSelf('box', 'box', l)).toBe(true);
    expect(isAncestorOrSelf('box', 'freezer', l)).toBe(false);
  });

  it('flags moving a container into its own subtree as a cycle', () => {
    const l = lookup(lab, freezer, box);
    expect(wouldCreateCycle('freezer', 'box', l)).toBe(true);
    expect(wouldCreateCycle('lab', 'box', l)).toBe(true);
    expect(wouldCreateCycle('box', 'lab', l)).toBe(false);
  });
});

describe('pathTo / fullPathLabel', () => {
  it('returns root-to-leaf ordering', () => {
    expect(pathTo('box', lookup(lab, freezer, box)).map((c) => c.name)).toEqual([
      'Lab A',
      'Freezer 1',
      'Box 7',
    ]);
  });

  it('joins names with the configured separator', () => {
    expect(fullPathLabel('box', lookup(lab, freezer, box))).toBe('Lab A / Freezer 1 / Box 7');
  });
});
