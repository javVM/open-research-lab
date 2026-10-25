import { parsePartialDate, type ItemStatus } from '@sample-operations/core';
import type { ParsedCsv } from './csv.js';
import { headerFor, type ColumnMapping, type ItemField } from './fields.js';

export interface ImportIssue {
  /** 1-based physical line number of the offending record. */
  row: number;
  /** Header name of the offending column, when one is identifiable. */
  column?: string;
  /** Plain-language reason, written for a non-developer. */
  reason: string;
}

export const ITEM_STATUSES: readonly ItemStatus[] = [
  'active',
  'checked_out',
  'consumed',
  'destroyed',
  'transferred_out',
  'lost',
  'archived',
];

/** Map a row's cells onto canonical fields (first matching header wins). */
export function extractRowValues(
  headers: readonly string[],
  fields: readonly string[],
  mapping: ColumnMapping,
): Partial<Record<ItemField, string>> {
  const values: Partial<Record<ItemField, string>> = {};
  headers.forEach((header, index) => {
    const field = mapping[header];
    if (field && values[field] === undefined) {
      values[field] = fields[index] ?? '';
    }
  });
  return values;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

/** Validate every row against the domain invariants, producing a dry-run report. */
export function validateRows(parsed: ParsedCsv, mapping: ColumnMapping): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const seenCodes = new Set<string>();

  for (const row of parsed.rows) {
    const values = extractRowValues(parsed.headers, row.fields, mapping);
    if (Object.values(values).every(isBlank)) {
      continue;
    }

    const code = values.code?.trim();
    if (isBlank(code)) {
      issues.push({ row: row.rowNumber, column: headerFor(mapping, 'code'), reason: 'code is required' });
    } else if (seenCodes.has(code!)) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'code'),
        reason: `duplicate code "${code}" appears earlier in this file`,
      });
    } else {
      seenCodes.add(code!);
    }

    const quantityValue = values.quantityValue;
    const quantityUnit = values.quantityUnit;
    const valueNumber = parseOptionalNumber(quantityValue);
    if (!isBlank(quantityValue) && valueNumber === undefined) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'quantityValue'),
        reason: `quantity value is not a number: "${quantityValue}"`,
      });
    }
    const hasValue = valueNumber !== undefined;
    const hasUnit = !isBlank(quantityUnit);
    if (hasValue !== hasUnit) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'quantityValue'),
        reason: hasValue ? 'quantity has a value but no unit' : 'quantity has a unit but no value',
      });
    }

    if (!isBlank(values.collectedAt) && parsePartialDate(values.collectedAt!) === null) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'collectedAt'),
        reason: `date is not a recognised YYYY, YYYY-MM or YYYY-MM-DD: "${values.collectedAt}"`,
      });
    }

    const hasLat = !isBlank(values.latitude);
    const hasLon = !isBlank(values.longitude);
    if (hasLat !== hasLon) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, hasLat ? 'longitude' : 'latitude'),
        reason: 'latitude and longitude must be provided together',
      });
    } else if (hasLat && hasLon) {
      const latitude = Number(values.latitude);
      const longitude = Number(values.longitude);
      if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
        issues.push({
          row: row.rowNumber,
          column: headerFor(mapping, 'latitude'),
          reason: `latitude out of range (-90..90): "${values.latitude}"`,
        });
      }
      if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
        issues.push({
          row: row.rowNumber,
          column: headerFor(mapping, 'longitude'),
          reason: `longitude out of range (-180..180): "${values.longitude}"`,
        });
      }
    }

    if (!isBlank(values.status) && !(ITEM_STATUSES as readonly string[]).includes(values.status!.trim())) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'status'),
        reason: `unknown status: "${values.status}"`,
      });
    }

    if (isBlank(values.containerPath) && !isBlank(values.position)) {
      issues.push({
        row: row.rowNumber,
        column: headerFor(mapping, 'position'),
        reason: 'position provided without a container path',
      });
    }
  }

  return issues;
}
