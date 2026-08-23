/**
 * The checks. Each one is small, independent, and explains itself in plain language.
 *
 * Severity rule: ERROR means "this is wrong and someone has to look at it"; WARNING means
 * "this looks suspicious, and only you can tell whether it is actually a problem". When in
 * doubt, warn — a validator that cries wolf gets ignored.
 *
 * This module is pure: it reads a parsed table and returns findings. It never touches the
 * filesystem and never modifies its input.
 */

import type { CsvTable } from './csv.ts';
import { detectColumns, type Detection } from './detection.ts';

export type Severity = 'error' | 'warning';

export interface Finding {
  readonly severity: Severity;
  /** Stable machine-readable code, e.g. 'duplicate-identifier'. */
  readonly code: string;
  /** One line, plain language, safe to show to a collection manager. */
  readonly message: string;
  /** How many rows/values this finding covers. */
  readonly count: number;
  /** A handful of concrete instances, so the finding is actionable. */
  readonly examples: readonly string[];
  /** Optional extra sentence explaining what to do or why we are unsure. */
  readonly note?: string;
}

export interface ValidationResult {
  readonly file: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly delimiter: string;
  readonly detection: Detection;
  readonly findings: readonly Finding[];
  readonly errorCount: number;
  readonly warningCount: number;
}

const MAX_EXAMPLES = 10;

export function validate(file: string, table: CsvTable): ValidationResult {
  const detection = detectColumns(table.header);
  const findings: Finding[] = [
    ...checkHeader(table),
    ...checkRowShape(table),
    ...checkEmptyAndDuplicateRows(table),
    ...checkIdentifier(table, detection),
    ...checkCoordinates(table, detection),
    ...checkDates(table, detection),
    ...checkLocality(table, detection),
    ...checkColumnConsistency(table, detection),
    ...checkDetectionGaps(detection),
  ];

  const order: Record<Severity, number> = { error: 0, warning: 1 };
  const sorted = [...findings].sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    file,
    rowCount: table.rows.length,
    columnCount: table.header.length,
    delimiter: table.delimiter,
    detection,
    findings: sorted,
    errorCount: sorted.filter((f) => f.severity === 'error').length,
    warningCount: sorted.filter((f) => f.severity === 'warning').length,
  };
}

/* ------------------------------------------------------------------ helpers */

function cell(values: readonly string[], index: number): string {
  return (values[index] ?? '').trim();
}

function finding(
  severity: Severity,
  code: string,
  message: string,
  examples: readonly string[],
  note?: string,
): Finding {
  return {
    severity,
    code,
    message,
    count: examples.length,
    examples: examples.slice(0, MAX_EXAMPLES),
    ...(note === undefined ? {} : { note }),
  };
}

function findingWithCount(
  severity: Severity,
  code: string,
  message: string,
  count: number,
  examples: readonly string[],
  note?: string,
): Finding {
  return {
    severity,
    code,
    message,
    count,
    examples: examples.slice(0, MAX_EXAMPLES),
    ...(note === undefined ? {} : { note }),
  };
}

/* ------------------------------------------------------------------- checks */

function checkHeader(table: CsvTable): Finding[] {
  const findings: Finding[] = [];

  const blank = table.header.filter((name) => name.trim() === '').length;
  if (blank > 0) {
    findings.push(
      findingWithCount(
        'warning',
        'blank-column-heading',
        `${blank} column${blank === 1 ? '' : 's'} in the first row ${blank === 1 ? 'has' : 'have'} no heading`,
        blank,
        [],
        'Columns without a heading cannot be checked, and most software will ignore them on import.',
      ),
    );
  }

  const seen = new Map<string, number>();
  for (const name of table.header) {
    if (name.trim() === '') continue;
    seen.set(name.trim(), (seen.get(name.trim()) ?? 0) + 1);
  }
  const repeated = [...seen.entries()].filter(([, count]) => count > 1);
  if (repeated.length > 0) {
    findings.push(
      finding(
        'error',
        'duplicate-column-heading',
        `${repeated.length} column heading${repeated.length === 1 ? ' is' : 's are'} used more than once`,
        repeated.map(([name, count]) => `"${name}" appears ${count} times`),
        'Repeated headings make it impossible to tell which column a value belongs to.',
      ),
    );
  }

  const padded = table.header.filter(
    (name) => name.trim() !== '' && (name !== name.trim() || / {2,}/.test(name)),
  );
  if (padded.length > 0) {
    findings.push(
      finding(
        'warning',
        'untidy-column-heading',
        `${padded.length} column heading${padded.length === 1 ? ' has' : 's have'} extra spaces`,
        padded.map((name) => `"${name}"`),
        'Harmless here, but it often stops other software from recognising the column.',
      ),
    );
  }

  return findings;
}

function checkRowShape(table: CsvTable): Finding[] {
  const expected = table.header.length;
  const wrong: string[] = [];
  let count = 0;
  for (const row of table.rows) {
    if (row.values.length === expected) continue;
    if (row.values.length === 1 && cell(row.values, 0) === '') continue; // blank line
    count += 1;
    wrong.push(
      `line ${row.line}: ${row.values.length} value${row.values.length === 1 ? '' : 's'} instead of ${expected}`,
    );
  }
  if (count === 0) return [];
  return [
    findingWithCount(
      'error',
      'wrong-number-of-values',
      `${count} row${count === 1 ? ' has' : 's have'} a different number of values than there are columns`,
      count,
      wrong,
      'Usually an unquoted comma inside a value, or a value containing a line break. Anything to the right of the problem is shifted into the wrong column.',
    ),
  ];
}

function checkEmptyAndDuplicateRows(table: CsvTable): Finding[] {
  const findings: Finding[] = [];

  const empty = table.rows.filter((row) => row.values.every((value) => value.trim() === ''));
  if (empty.length > 0) {
    findings.push(
      finding(
        'warning',
        'empty-row',
        `${empty.length} completely empty row${empty.length === 1 ? '' : 's'}`,
        empty.map((row) => `line ${row.line}`),
      ),
    );
  }

  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  let duplicateCount = 0;
  for (const row of table.rows) {
    if (row.values.every((value) => value.trim() === '')) continue;
    const key = row.values.map((value) => value.trim()).join('\u0000');
    const firstLine = seen.get(key);
    if (firstLine === undefined) {
      seen.set(key, row.line);
    } else {
      duplicateCount += 1;
      duplicates.push(`line ${row.line} repeats line ${firstLine}`);
    }
  }
  if (duplicateCount > 0) {
    findings.push(
      findingWithCount(
        'warning',
        'duplicate-row',
        duplicateCount === 1
          ? '1 row is an exact copy of an earlier row'
          : `${duplicateCount} rows are exact copies of an earlier row`,
        duplicateCount,
        duplicates,
        'Every value is identical, including the identifier. Often a copy-and-paste or a double import.',
      ),
    );
  }

  return findings;
}

function checkIdentifier(table: CsvTable, detection: Detection): Finding[] {
  const identifier = detection.identifier;
  if (identifier === undefined) return [];
  const findings: Finding[] = [];

  const missing: string[] = [];
  const seen = new Map<string, number>();
  const duplicates = new Map<string, { first: number; lines: number[] }>();

  for (const row of table.rows) {
    if (row.values.every((value) => value.trim() === '')) continue;
    const value = cell(row.values, identifier.index);
    if (value === '') {
      missing.push(`line ${row.line}`);
      continue;
    }
    const previous = seen.get(value);
    if (previous === undefined) {
      seen.set(value, row.line);
    } else {
      const entry = duplicates.get(value) ?? { first: previous, lines: [] };
      entry.lines.push(row.line);
      duplicates.set(value, entry);
    }
  }

  if (missing.length > 0) {
    findings.push(
      finding(
        'error',
        'missing-identifier',
        `${missing.length} row${missing.length === 1 ? ' has' : 's have'} no ${identifier.concept.label} ("${identifier.header}")`,
        missing,
        'A record with no identifier cannot be matched to the physical object or to any other list.',
      ),
    );
  }

  if (duplicates.size > 0) {
    const repeatedRows = [...duplicates.values()].reduce((sum, e) => sum + e.lines.length, 0);
    findings.push(
      findingWithCount(
        'error',
        'duplicate-identifier',
        `${duplicates.size} ${identifier.concept.label}${duplicates.size === 1 ? ' is' : 's are'} used by more than one row (${repeatedRows} repeated row${repeatedRows === 1 ? '' : 's'})`,
        duplicates.size,
        [...duplicates.entries()].map(
          ([value, entry]) =>
            `"${value}" on line ${entry.first} and line${entry.lines.length === 1 ? '' : 's'} ${entry.lines.join(', ')}`,
        ),
        'Two objects sharing a number, or the same object entered twice. Both are worth checking by hand.',
      ),
    );
  }

  return findings;
}

const COORDINATE_LIMITS = { latitude: 90, longitude: 180 } as const;

/** A value written as degrees/minutes/seconds, or with a compass direction attached. */
function looksLikeDegreesAndMinutes(raw: string): boolean {
  return /\d\s*[°'′"″]/.test(raw) || /^-?[\d.,\s]+[NSEWnsew]$/.test(raw.trim());
}

function checkCoordinates(table: CsvTable, detection: Detection): Finding[] {
  const latitude = detection.columns.find((c) => c.concept.id === 'latitude');
  const longitude = detection.columns.find((c) => c.concept.id === 'longitude');
  const findings: Finding[] = [];

  for (const column of [latitude, longitude]) {
    if (column === undefined) continue;
    const limit = COORDINATE_LIMITS[column.concept.id as 'latitude' | 'longitude'];
    const outOfRange: string[] = [];
    const notANumber: string[] = [];
    const degreesMinutesSeconds: string[] = [];

    for (const row of table.rows) {
      const raw = cell(row.values, column.index);
      if (raw === '') continue;
      const value = Number(raw.replace(',', '.'));
      if (Number.isNaN(value)) {
        if (looksLikeDegreesAndMinutes(raw)) degreesMinutesSeconds.push(`line ${row.line}: "${raw}"`);
        else notANumber.push(`line ${row.line}: "${raw}"`);
        continue;
      }
      if (value < -limit || value > limit) {
        outOfRange.push(`line ${row.line}: ${raw}`);
      }
    }

    if (outOfRange.length > 0) {
      findings.push(
        finding(
          'error',
          `${column.concept.id}-out-of-range`,
          `${outOfRange.length} ${column.concept.label} value${outOfRange.length === 1 ? ' is' : 's are'} outside the possible range (−${limit} to ${limit})`,
          outOfRange,
          'Often latitude and longitude swapped, or a stray digit.',
        ),
      );
    }
    if (notANumber.length > 0) {
      findings.push(
        finding(
          'error',
          `${column.concept.id}-not-a-number`,
          `${notANumber.length} ${column.concept.label} value${notANumber.length === 1 ? ' is' : 's are'} not a number`,
          notANumber,
        ),
      );
    }
    if (degreesMinutesSeconds.length > 0) {
      findings.push(
        finding(
          'warning',
          `${column.concept.id}-not-decimal`,
          `${degreesMinutesSeconds.length} ${column.concept.label} value${degreesMinutesSeconds.length === 1 ? ' looks' : 's look'} like degrees and minutes rather than a decimal number`,
          degreesMinutesSeconds,
          'Not necessarily wrong, but most systems expect decimal degrees, for example 40.4168 and −3.7038.',
        ),
      );
    }
  }

  if (latitude !== undefined && longitude !== undefined) {
    const halfPairs: string[] = [];
    const zeroZero: string[] = [];
    for (const row of table.rows) {
      const lat = cell(row.values, latitude.index);
      const lon = cell(row.values, longitude.index);
      if (lat === '' && lon === '') continue;
      if (lat === '' || lon === '') {
        halfPairs.push(`line ${row.line}: ${lat === '' ? 'latitude' : 'longitude'} is empty`);
        continue;
      }
      if (Number(lat) === 0 && Number(lon) === 0) zeroZero.push(`line ${row.line}`);
    }
    if (halfPairs.length > 0) {
      findings.push(
        finding(
          'warning',
          'incomplete-coordinate-pair',
          `${halfPairs.length} row${halfPairs.length === 1 ? ' has' : 's have'} only one half of the coordinate pair`,
          halfPairs,
          'A latitude without a longitude cannot be plotted.',
        ),
      );
    }
    if (zeroZero.length > 0) {
      findings.push(
        finding(
          'warning',
          'zero-coordinates',
          `${zeroZero.length} row${zeroZero.length === 1 ? ' has' : 's have'} coordinates of exactly 0, 0`,
          zeroZero,
          'That point is in the Gulf of Guinea. It is usually an empty field that was filled with zeros.',
        ),
      );
    }
  }

  return findings;
}

interface DateVerdict {
  readonly kind: 'ok' | 'impossible' | 'unrecognised' | 'ambiguous' | 'future';
  readonly detail?: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const SLASHED = /^(\d{1,4})[/.](\d{1,2})(?:[/.](\d{1,4}))?$/;
const YEAR_ONLY = /^\d{4}$/;

export function inspectDate(raw: string, today: Date = new Date()): DateVerdict {
  const value = raw.trim();
  if (YEAR_ONLY.test(value)) {
    const year = Number(value);
    if (year > today.getUTCFullYear()) return { kind: 'future', detail: 'year is in the future' };
    return { kind: 'ok' };
  }

  const iso = ISO_DATE.exec(value);
  if (iso) {
    const [, year, month, day] = iso as unknown as [string, string, string, string | undefined];
    if (!isRealDate(Number(year), Number(month), day === undefined ? 1 : Number(day))) {
      return { kind: 'impossible', detail: 'that day does not exist' };
    }
    if (Date.UTC(Number(year), Number(month) - 1, day === undefined ? 1 : Number(day)) > today.getTime()) {
      return { kind: 'future', detail: 'the date is in the future' };
    }
    return { kind: 'ok' };
  }

  const slashed = SLASHED.exec(value);
  if (slashed) {
    const [, first, second, third] = slashed;
    if (first === undefined || second === undefined) return { kind: 'unrecognised' };

    if (first.length === 4) {
      const day = third === undefined ? 1 : Number(third);
      if (!isRealDate(Number(first), Number(second), day)) {
        return { kind: 'impossible', detail: 'that day does not exist' };
      }
      if (Date.UTC(Number(first), Number(second) - 1, day) > today.getTime()) {
        return { kind: 'future', detail: 'the date is in the future' };
      }
      return { kind: 'ok' };
    }

    const a = Number(first);
    const b = Number(second);
    if (a > 12 && b > 12) return { kind: 'impossible', detail: 'no part of it can be a month' };
    if (a > 31 || b > 31) {
      return { kind: 'impossible', detail: 'one part is too large to be a day or a month' };
    }

    if (third === undefined) {
      return { kind: 'ambiguous', detail: 'no year is given, so the date cannot be checked' };
    }
    if (third.length === 3) {
      return { kind: 'impossible', detail: 'the year is neither two nor four digits' };
    }

    const twoDigitYear = third.length === 2;
    const year = twoDigitYear ? 2000 : Number(third);
    const readings: readonly (readonly [number, number])[] =
      a > 12 ? [[a, b]] : b > 12 ? [[b, a]] : [[a, b], [b, a]];
    const possible = readings.filter(([day, month]) => isRealDate(year, month, day));
    const resolved = possible[0];
    if (resolved === undefined) return { kind: 'impossible', detail: 'that day does not exist' };

    if (twoDigitYear) {
      return { kind: 'ambiguous', detail: 'the year has two digits, so the century is a guess' };
    }
    if (possible.length > 1) {
      return {
        kind: 'ambiguous',
        detail: 'day and month order cannot be determined from the value alone',
      };
    }
    const [day, month] = resolved;
    if (Date.UTC(year, month - 1, day) > today.getTime()) {
      return { kind: 'future', detail: 'the date is in the future' };
    }
    return { kind: 'ok' };
  }

  return { kind: 'unrecognised' };
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function checkDates(table: CsvTable, detection: Detection): Finding[] {
  const column = detection.columns.find((c) => c.concept.id === 'eventDate');
  if (column === undefined) return [];

  const missing: string[] = [];
  const impossible: string[] = [];
  const unrecognised: string[] = [];
  const ambiguous: string[] = [];
  const future: string[] = [];

  for (const row of table.rows) {
    if (row.values.every((value) => value.trim() === '')) continue;
    const raw = cell(row.values, column.index);
    if (raw === '') {
      missing.push(`line ${row.line}`);
      continue;
    }
    const verdict = inspectDate(raw);
    const example = `line ${row.line}: "${raw}"${verdict.detail === undefined ? '' : ` — ${verdict.detail}`}`;
    if (verdict.kind === 'impossible') impossible.push(example);
    else if (verdict.kind === 'unrecognised') unrecognised.push(example);
    else if (verdict.kind === 'ambiguous') ambiguous.push(example);
    else if (verdict.kind === 'future') future.push(example);
  }

  const findings: Finding[] = [];
  if (impossible.length > 0) {
    findings.push(
      finding(
        'error',
        'impossible-date',
        `${impossible.length} date${impossible.length === 1 ? '' : 's'} in "${column.header}" cannot exist`,
        impossible,
      ),
    );
  }
  if (missing.length > 0) {
    findings.push(
      finding(
        'warning',
        'missing-date',
        `${missing.length} row${missing.length === 1 ? ' has' : 's have'} no ${column.concept.label} ("${column.header}")`,
        missing,
      ),
    );
  }
  if (unrecognised.length > 0) {
    findings.push(
      finding(
        'warning',
        'unrecognised-date',
        `${unrecognised.length} date${unrecognised.length === 1 ? ' is' : 's are'} in a format we could not read`,
        unrecognised,
        'This may be perfectly clear to a person ("summer 1976") and still be unusable by software.',
      ),
    );
  }
  if (ambiguous.length > 0) {
    findings.push(
      finding(
        'warning',
        'ambiguous-date',
        `${ambiguous.length} date${ambiguous.length === 1 ? ' could' : 's could'} be read two ways (day/month or month/day)`,
        ambiguous,
        'A date like 03/04/1998 means different things in different countries. Year-month-day (1998-04-03) removes the doubt.',
      ),
    );
  }
  if (future.length > 0) {
    findings.push(
      finding(
        'warning',
        'future-date',
        `${future.length} date${future.length === 1 ? ' is' : 's are'} in the future`,
        future,
        'Usually a typo in the year.',
      ),
    );
  }
  return findings;
}

function checkLocality(table: CsvTable, detection: Detection): Finding[] {
  const column = detection.columns.find((c) => c.concept.id === 'locality');
  if (column === undefined) return [];

  const missing: string[] = [];
  for (const row of table.rows) {
    if (row.values.every((value) => value.trim() === '')) continue;
    if (cell(row.values, column.index) === '') missing.push(`line ${row.line}`);
  }
  if (missing.length === 0) return [];
  return [
    finding(
      'warning',
      'missing-locality',
      `${missing.length} row${missing.length === 1 ? ' has' : 's have'} no ${column.concept.label} ("${column.header}")`,
      missing,
      'A specimen with no place recorded anywhere is much less useful for research.',
    ),
  ];
}

/**
 * Very cautious consistency check: if a column holds a number in nearly every row and
 * something else in a handful, say so. No claim is made about what the column means —
 * coordinate and date columns are excluded because they are checked properly above.
 */
function checkColumnConsistency(table: CsvTable, detection: Detection): Finding[] {
  const findings: Finding[] = [];
  const alreadyChecked = new Set(
    detection.columns
      .filter((column) => ['latitude', 'longitude', 'eventDate'].includes(column.concept.id))
      .map((column) => column.index),
  );

  table.header.forEach((header, index) => {
    if (header.trim() === '' || alreadyChecked.has(index)) return;
    const values = table.rows
      .map((row) => ({ line: row.line, value: cell(row.values, index) }))
      .filter((entry) => entry.value !== '');
    if (values.length < 10) return;

    const oddOnes = values.filter((entry) => Number.isNaN(Number(entry.value)));
    const ratio = (values.length - oddOnes.length) / values.length;
    if (ratio >= 0.9 && ratio < 1) {
      findings.push(
        finding(
          'warning',
          'mixed-values-in-column',
          `"${header}" holds a number in ${Math.round(ratio * 100)}% of rows and something else in ${oddOnes.length}`,
          oddOnes.map((entry) => `line ${entry.line}: "${entry.value}"`),
          'Worth a look: a column that is almost always numeric usually should be.',
        ),
      );
    }
  });

  return findings;
}

function checkDetectionGaps(detection: Detection): Finding[] {
  const findings: Finding[] = [];

  if (detection.identifier === undefined) {
    findings.push(
      finding(
        'warning',
        'no-identifier-column',
        'no column looked like a catalogue or specimen number, so nothing was checked for duplicate or missing identifiers',
        [],
        'If one of your columns holds the catalogue number, tell us its heading — we will add it to the list of names we recognise.',
      ),
    );
  }

  for (const column of detection.columns) {
    if (column.alsoMatched.length === 0) continue;
    findings.push(
      finding(
        'warning',
        'several-columns-matched',
        `${column.alsoMatched.length + 1} columns could be the ${column.concept.label}; only "${column.header}" was checked`,
        column.alsoMatched.map((other) => `"${other.header}" was not checked`),
      ),
    );
  }

  return findings;
}
