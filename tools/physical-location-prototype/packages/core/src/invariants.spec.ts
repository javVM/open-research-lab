import { describe, expect, it } from 'vitest';
import {
  canChangeLocation,
  isGridCapable,
  isTerminalStatus,
  positionIsWithinBounds,
  validateQuantity,
} from './invariants.js';
import type { Container } from './model.js';

function container(overrides: Partial<Container> = {}): Container {
  return {
    id: 'c1',
    name: 'Box',
    parentId: null,
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
    ...overrides,
  };
}

describe('isTerminalStatus / canChangeLocation', () => {
  it('treats consumed/destroyed/transferred_out/lost as terminal', () => {
    for (const status of ['consumed', 'destroyed', 'transferred_out', 'lost'] as const) {
      expect(isTerminalStatus(status)).toBe(true);
    }
    expect(isTerminalStatus('active')).toBe(false);
    expect(isTerminalStatus('archived')).toBe(false);
  });

  it('allows location changes only for active and checked-out items', () => {
    expect(canChangeLocation('active')).toBe(true);
    expect(canChangeLocation('checked_out')).toBe(true);
    expect(canChangeLocation('destroyed')).toBe(false);
  });
});

describe('isGridCapable / positionIsWithinBounds', () => {
  it('detects grid capability only when both dimensions are set', () => {
    expect(isGridCapable(container())).toBe(false);
    expect(isGridCapable(container({ gridRows: 9, gridColumns: 9 }))).toBe(true);
    expect(isGridCapable(container({ gridRows: 9 }))).toBe(false);
  });

  it('accepts positions inside declared dimensions and rejects the rest', () => {
    const grid = container({ gridRows: 3, gridColumns: 4 });
    expect(positionIsWithinBounds(grid, 1, 1)).toBe(true);
    expect(positionIsWithinBounds(grid, 3, 4)).toBe(true);
    expect(positionIsWithinBounds(grid, 4, 1)).toBe(false);
    expect(positionIsWithinBounds(grid, 1, 5)).toBe(false);
    expect(positionIsWithinBounds(grid, 0, 1)).toBe(false);
  });

  it('rejects any position for a non-grid container', () => {
    expect(positionIsWithinBounds(container(), 1, 1)).toBe(false);
  });
});

describe('validateQuantity', () => {
  it('accepts a value together with a unit', () => {
    expect(validateQuantity(50, 'µL')).toEqual({ ok: true, quantity: { value: 50, unit: 'µL' } });
  });

  it('accepts both absent', () => {
    expect(validateQuantity(undefined, undefined)).toEqual({ ok: true });
  });

  it('rejects a value without a unit', () => {
    const result = validateQuantity(50, undefined);
    expect(result.ok).toBe(false);
    expect(result.issue).toMatch(/no unit/);
  });

  it('rejects a unit without a value', () => {
    const result = validateQuantity(undefined, 'µL');
    expect(result.ok).toBe(false);
    expect(result.issue).toMatch(/no value/);
  });

  it('treats a blank unit as absent', () => {
    expect(validateQuantity(50, '   ').ok).toBe(false);
  });
});
