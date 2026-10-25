import type { LabelScheme } from './model.js';

/**
 * Grid label schemes and position materialisation (domain-model §2.3).
 *
 * `alpha` labels rows/columns with letters (A=1, B=2, … Z, AA, AB, …);
 * `numeric` labels them with 1-based numbers. A position label is the row
 * label followed by the column label, e.g. `C04` is row C, column 4. Numeric
 * labels are produced with no zero-padding here; padding is a display concern
 * and is applied by the caller when it needs `C04`-style labels.
 */

/** 1-based index → spreadsheet-style letters: 1→A, 26→Z, 27→AA. */
export function indexToAlpha(index: number): string {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(`index must be a positive integer, got ${index}`);
  }
  let value = index;
  let label = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

/** Spreadsheet-style letters → 1-based index: A→1, Z→26, AA→27. */
export function alphaToIndex(label: string): number {
  if (!/^[A-Za-z]+$/.test(label)) {
    throw new RangeError(`not a valid alpha label: ${label}`);
  }
  let index = 0;
  for (const char of label.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index;
}

export function labelForIndex(index: number, scheme: LabelScheme): string {
  return scheme === 'alpha' ? indexToAlpha(index) : String(index);
}

/** A position's row/column label pair, plus its combined label. */
export interface PositionLabel {
  rowIndex: number;
  columnIndex: number;
  label: string;
}

export function positionLabel(
  rowIndex: number,
  columnIndex: number,
  rowScheme: LabelScheme,
  columnScheme: LabelScheme,
): string {
  return labelForIndex(rowIndex, rowScheme) + labelForIndex(columnIndex, columnScheme);
}

/**
 * Parse a position label back into indices, tolerant of the formats real
 * spreadsheets contain: `C4` and `C04` both parse to row 3, column 4 when the
 * row scheme is alpha and the column scheme numeric. Returns `null` when the
 * label does not match the configured schemes.
 */
export function parsePositionLabel(
  label: string,
  rowScheme: LabelScheme,
  columnScheme: LabelScheme,
): { rowIndex: number; columnIndex: number } | null {
  const text = label.trim();
  const rowPattern = rowScheme === 'alpha' ? /^[A-Za-z]+/ : /^\d+/;
  const rowMatch = rowPattern.exec(text);
  if (!rowMatch) {
    return null;
  }
  const rowPart = rowMatch[0];
  const columnPart = text.slice(rowPart.length);
  if (columnPart.length === 0) {
    return null;
  }

  const columnPattern = columnScheme === 'alpha' ? /^[A-Za-z]+$/ : /^\d+$/;
  if (!columnPattern.test(columnPart)) {
    return null;
  }

  const rowIndex = rowScheme === 'alpha' ? alphaToIndex(rowPart) : Number(rowPart);
  const columnIndex = columnScheme === 'alpha' ? alphaToIndex(columnPart) : Number(columnPart);
  if (!Number.isInteger(rowIndex) || rowIndex < 1 || !Number.isInteger(columnIndex) || columnIndex < 1) {
    return null;
  }
  return { rowIndex, columnIndex };
}

/** All positions of a grid-capable container, in row-major order. */
export function materializePositions(
  gridRows: number,
  gridColumns: number,
  rowScheme: LabelScheme,
  columnScheme: LabelScheme,
): PositionLabel[] {
  if (gridRows < 1 || gridColumns < 1) {
    throw new RangeError(`grid dimensions must be positive, got ${gridRows}×${gridColumns}`);
  }
  const positions: PositionLabel[] = [];
  for (let row = 1; row <= gridRows; row++) {
    for (let column = 1; column <= gridColumns; column++) {
      positions.push({
        rowIndex: row,
        columnIndex: column,
        label: positionLabel(row, column, rowScheme, columnScheme),
      });
    }
  }
  return positions;
}
