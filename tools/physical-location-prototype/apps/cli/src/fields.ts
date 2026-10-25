/**
 * Canonical import/export fields and column mapping.
 *
 * The importer maps CSV headers onto these canonical fields. The default
 * mapping is identity (a header equal to a field name maps to that field);
 * a `--mapping` JSON file can remap arbitrary headers (e.g. a Symbiota/Specify
 * export's columns) onto the same fields.
 */

export const ITEM_FIELDS = [
  'code',
  'name',
  'itemType',
  'containerPath',
  'containerType',
  'position',
  'quantityValue',
  'quantityUnit',
  'collectedAt',
  'collectedBy',
  'locality',
  'latitude',
  'longitude',
  'notes',
  'status',
] as const;

export type ItemField = (typeof ITEM_FIELDS)[number];

/** Header order used by `export`; the importer reads these back by identity. */
export const EXPORT_HEADERS: readonly ItemField[] = [
  'code',
  'name',
  'itemType',
  'containerPath',
  'containerType',
  'position',
  'quantityValue',
  'quantityUnit',
  'collectedAt',
  'collectedBy',
  'locality',
  'latitude',
  'longitude',
  'notes',
  'status',
];

/** header name → canonical field. Unknown headers are simply unmapped. */
export type ColumnMapping = Record<string, ItemField>;

export function isItemField(value: string): value is ItemField {
  return (ITEM_FIELDS as readonly string[]).includes(value);
}

export function defaultMapping(headers: readonly string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    if (isItemField(header)) {
      mapping[header] = header;
    }
  }
  return mapping;
}

/**
 * Parse a mapping JSON object (`{ "header": "field" }`). Throws on any value
 * that is not a canonical field name, so a typo fails loudly instead of being
 * silently ignored.
 */
export function parseMappingConfig(json: string): ColumnMapping {
  const raw: unknown = JSON.parse(json);
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('mapping must be a JSON object of { "header": "field" }');
  }
  const mapping: ColumnMapping = {};
  for (const [header, field] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof field !== 'string' || !isItemField(field)) {
      throw new Error(`mapping value for "${header}" is not a known field: ${String(field)}`);
    }
    mapping[header] = field;
  }
  return mapping;
}

/** Merge the identity mapping with a user config (config wins). */
export function resolveMapping(headers: readonly string[], config?: ColumnMapping): ColumnMapping {
  const mapping = defaultMapping(headers);
  if (config) {
    for (const [header, field] of Object.entries(config)) {
      mapping[header] = field;
    }
  }
  return mapping;
}

/** Find a header that maps to `field`, for pointing at a column in a report. */
export function headerFor(mapping: ColumnMapping, field: ItemField): string | undefined {
  for (const [header, mapped] of Object.entries(mapping)) {
    if (mapped === field) {
      return header;
    }
  }
  return undefined;
}
