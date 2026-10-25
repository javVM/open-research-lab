import type { Container, ItemStatus, Quantity } from './model.js';

/**
 * The documented domain invariants, expressed as pure predicates/validators.
 * Each invariant in `docs/product/requirements.md` §4 is covered here or (for
 * those the database enforces structurally) referenced. These are the rules the
 * import pipeline validates against before writing anything.
 */

export const TERMINAL_ITEM_STATUSES: readonly ItemStatus[] = [
  'consumed',
  'destroyed',
  'transferred_out',
  'lost',
];

/** Invariant 9: terminal items cannot be moved again (but history stays readable). */
export function isTerminalStatus(status: ItemStatus): boolean {
  return TERMINAL_ITEM_STATUSES.includes(status);
}

/** Whether an item's location may still change. */
export function canChangeLocation(status: ItemStatus): boolean {
  return status === 'active' || status === 'checked_out';
}

/** A container is grid-capable iff both dimensions are set (domain-model §2.1). */
export function isGridCapable(container: Container): boolean {
  return container.gridRows !== null && container.gridRows !== undefined && container.gridColumns !== null && container.gridColumns !== undefined;
}

/** Invariant 4: an enumerated position must exist within declared dimensions. */
export function positionIsWithinBounds(
  container: Container,
  rowIndex: number,
  columnIndex: number,
): boolean {
  if (!isGridCapable(container)) {
    return false;
  }
  const rows = container.gridRows!;
  const columns = container.gridColumns!;
  return (
    Number.isInteger(rowIndex) &&
    Number.isInteger(columnIndex) &&
    rowIndex >= 1 &&
    rowIndex <= rows &&
    columnIndex >= 1 &&
    columnIndex <= columns
  );
}

export interface QuantityValidation {
  ok: boolean;
  quantity?: Quantity;
  issue?: string;
}

/** Invariant 8: a quantity without a unit (or a unit without a value) is invalid. */
export function validateQuantity(
  value: number | undefined | null,
  unit: string | undefined | null,
): QuantityValidation {
  const hasValue = value !== undefined && value !== null && !Number.isNaN(value);
  const hasUnit = unit !== undefined && unit !== null && unit.trim() !== '';

  if (hasValue !== hasUnit) {
    return {
      ok: false,
      issue: hasValue ? 'quantity has a value but no unit' : 'quantity has a unit but no value',
    };
  }
  if (!hasValue) {
    return { ok: true };
  }
  return { ok: true, quantity: { value: value as number, unit: unit!.trim() } };
}
