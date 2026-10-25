import { describe, expect, it } from 'vitest';
import {
  alphaToIndex,
  indexToAlpha,
  labelForIndex,
  materializePositions,
  parsePositionLabel,
  positionLabel,
} from './labeling.js';

describe('indexToAlpha / alphaToIndex', () => {
  it('converts 1-based indices to spreadsheet letters', () => {
    expect(indexToAlpha(1)).toBe('A');
    expect(indexToAlpha(26)).toBe('Z');
    expect(indexToAlpha(27)).toBe('AA');
    expect(indexToAlpha(52)).toBe('AZ');
    expect(indexToAlpha(53)).toBe('BA');
    expect(indexToAlpha(703)).toBe('AAA');
  });

  it('round-trips letters back to indices', () => {
    for (const index of [1, 26, 27, 52, 53, 703]) {
      expect(alphaToIndex(indexToAlpha(index))).toBe(index);
    }
  });

  it('is case-insensitive when parsing alpha labels', () => {
    expect(alphaToIndex('c')).toBe(3);
  });

  it('rejects non-positive or non-integer indices', () => {
    expect(() => indexToAlpha(0)).toThrow(RangeError);
    expect(() => indexToAlpha(1.5)).toThrow(RangeError);
  });
});

describe('positionLabel', () => {
  it('combines row and column labels', () => {
    expect(positionLabel(3, 4, 'alpha', 'numeric')).toBe('C4');
    expect(positionLabel(3, 4, 'alpha', 'alpha')).toBe('CD');
    expect(positionLabel(3, 4, 'numeric', 'numeric')).toBe('34');
  });
});

describe('materializePositions', () => {
  it('enumerates every cell in row-major order', () => {
    const positions = materializePositions(2, 3, 'alpha', 'numeric');
    expect(positions.map((p) => p.label)).toEqual(['A1', 'A2', 'A3', 'B1', 'B2', 'B3']);
  });

  it('produces 81 positions for a 9×9 grid', () => {
    expect(materializePositions(9, 9, 'alpha', 'numeric')).toHaveLength(81);
  });

  it('rejects non-positive dimensions', () => {
    expect(() => materializePositions(0, 3, 'alpha', 'numeric')).toThrow(RangeError);
  });
});

describe('labelForIndex', () => {
  it('delegates to the configured scheme', () => {
    expect(labelForIndex(3, 'alpha')).toBe('C');
    expect(labelForIndex(3, 'numeric')).toBe('3');
  });
});

describe('parsePositionLabel', () => {
  it('parses alpha-row/numeric-column labels, ignoring zero-padding', () => {
    expect(parsePositionLabel('C4', 'alpha', 'numeric')).toEqual({ rowIndex: 3, columnIndex: 4 });
    expect(parsePositionLabel('C04', 'alpha', 'numeric')).toEqual({ rowIndex: 3, columnIndex: 4 });
    expect(parsePositionLabel('A12', 'alpha', 'numeric')).toEqual({ rowIndex: 1, columnIndex: 12 });
  });

  it('parses numeric-row/alpha-column labels', () => {
    expect(parsePositionLabel('1A', 'numeric', 'alpha')).toEqual({ rowIndex: 1, columnIndex: 1 });
  });

  it('rejects labels that do not match the schemes', () => {
    expect(parsePositionLabel('4', 'alpha', 'numeric')).toBeNull();
    expect(parsePositionLabel('C4X', 'alpha', 'numeric')).toBeNull();
    expect(parsePositionLabel('', 'alpha', 'numeric')).toBeNull();
  });
});
