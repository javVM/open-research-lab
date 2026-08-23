import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { detectDelimiter, parseCsv } from '../src/csv.ts';
import { inspectDate, validate, type Finding, type ValidationResult } from '../src/validation.ts';

function check(fixture: string): ValidationResult {
  const path = fileURLToPath(new URL(`../fixtures/${fixture}`, import.meta.url));
  const text = readFileSync(path, 'utf8');
  return validate(fixture, parseCsv(text, detectDelimiter(text)));
}

function found(result: ValidationResult, code: string): Finding {
  const finding = result.findings.find((f) => f.code === code);
  assert.ok(
    finding,
    `expected a "${code}" finding, got: ${result.findings.map((f) => f.code).join(', ') || '(none)'}`,
  );
  return finding;
}

function codes(result: ValidationResult): string[] {
  return result.findings.map((f) => f.code);
}

test('a clean export produces no findings at all', () => {
  const result = check('clean.csv');
  assert.deepEqual(codes(result), []);
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
  assert.equal(result.rowCount, 5);
});

test('a clean export reports the columns it recognised and why', () => {
  const result = check('clean.csv');
  const recognised = new Map(result.detection.columns.map((c) => [c.concept.id, c.header]));
  assert.equal(recognised.get('catalogNumber'), 'CatalogNumber');
  assert.equal(recognised.get('locality'), 'Locality');
  assert.equal(recognised.get('latitude'), 'DecimalLatitude');
  assert.equal(recognised.get('longitude'), 'DecimalLongitude');
  assert.equal(recognised.get('eventDate'), 'EventDate');
  assert.equal(recognised.get('collector'), 'RecordedBy');
  assert.equal(result.detection.identifier?.header, 'CatalogNumber');
  assert.deepEqual(result.detection.unrecognisedHeaders, ['ScientificName']);
  for (const column of result.detection.columns) {
    assert.match(column.reason, /recognise/);
  }
});

test('repeated catalogue numbers are errors and name the values involved', () => {
  const result = check('duplicate-identifiers.csv');
  const finding = found(result, 'duplicate-identifier');
  assert.equal(finding.severity, 'error');
  assert.equal(finding.count, 2);
  assert.ok(finding.examples.some((e) => e.includes('"ABC-001"')));
  assert.ok(finding.examples.some((e) => e.includes('"ABC-002"')));
});

test('a row with no catalogue number is an error that points at the line', () => {
  const finding = found(check('duplicate-identifiers.csv'), 'missing-identifier');
  assert.equal(finding.severity, 'error');
  assert.equal(finding.count, 1);
  assert.deepEqual(finding.examples, ['line 7']);
});

test('coordinates outside the possible range are errors, one finding per axis', () => {
  const result = check('bad-coordinates.csv');
  const latitude = found(result, 'latitude-out-of-range');
  const longitude = found(result, 'longitude-out-of-range');
  assert.equal(latitude.severity, 'error');
  assert.equal(latitude.count, 1);
  assert.ok(latitude.examples[0]?.includes('145.6'));
  assert.equal(longitude.severity, 'error');
  assert.equal(longitude.count, 1);
  assert.ok(longitude.examples[0]?.includes('-361.9'));
});

test('non-numeric coordinates are errors, but degrees-and-minutes is only a warning', () => {
  const result = check('bad-coordinates.csv');
  assert.equal(found(result, 'latitude-not-a-number').severity, 'error');
  assert.equal(found(result, 'latitude-not-decimal').severity, 'warning');
  assert.equal(found(result, 'longitude-not-decimal').severity, 'warning');
});

test('zero/zero coordinates and half-filled pairs are warnings, not errors', () => {
  const result = check('bad-coordinates.csv');
  assert.equal(found(result, 'zero-coordinates').severity, 'warning');
  const incomplete = found(result, 'incomplete-coordinate-pair');
  assert.equal(incomplete.severity, 'warning');
  assert.ok(incomplete.examples.some((e) => e.includes('longitude is empty')));
});

test('a missing locality is a warning, and whitespace counts as missing', () => {
  const result = check('missing-locality.csv');
  const finding = found(result, 'missing-locality');
  assert.equal(finding.severity, 'warning');
  assert.equal(finding.count, 2);
  assert.equal(result.errorCount, 0);
});

test('a specimen id column is used as the identifier when there is no catalogue number', () => {
  const result = check('missing-locality.csv');
  assert.equal(result.detection.identifier?.header, 'SpecimenID');
});

test('a date that cannot exist is an error; unclear dates are warnings', () => {
  const result = check('messy-dates.csv');
  const impossible = found(result, 'impossible-date');
  assert.equal(impossible.severity, 'error');
  assert.ok(impossible.examples[0]?.includes('1989-02-31'));

  assert.equal(found(result, 'ambiguous-date').severity, 'warning');
  assert.ok(found(result, 'unrecognised-date').examples[0]?.includes('summer 1976'));
  assert.equal(found(result, 'missing-date').count, 1);
  assert.equal(found(result, 'future-date').severity, 'warning');
});

test('a date whose day and month order is decided by the value itself is accepted', () => {
  const today = new Date('2026-01-01T00:00:00Z');
  assert.equal(inspectDate('14/07/1998', today).kind, 'ok');
  assert.equal(inspectDate('1998.07.14', today).kind, 'ok');
  assert.equal(inspectDate('03/04/1998', today).kind, 'ambiguous');
});

test('a two-digit year is unclear rather than impossible', () => {
  const verdict = inspectDate('03/04/98', new Date('2026-01-01T00:00:00Z'));
  assert.equal(verdict.kind, 'ambiguous');
  assert.match(verdict.detail ?? '', /two digits/);
});

test('a day that exists in neither reading is impossible', () => {
  const today = new Date('2026-01-01T00:00:00Z');
  assert.equal(inspectDate('31/02/1998', today).kind, 'impossible');
  assert.equal(inspectDate('13/13/1998', today).kind, 'impossible');
  assert.equal(inspectDate('14/07/2999', today).kind, 'future');
});

test('a four-digit year on its own is accepted', () => {
  const result = check('messy-dates.csv');
  for (const finding of result.findings) {
    assert.ok(!finding.examples.some((e) => e.includes('"1994"')), `1994 flagged by ${finding.code}`);
  }
});

test('empty rows and exact duplicate rows are reported separately, as warnings', () => {
  const result = check('empty-and-duplicate-rows.csv');
  const empty = found(result, 'empty-row');
  assert.equal(empty.severity, 'warning');
  assert.equal(empty.count, 2);

  const duplicate = found(result, 'duplicate-row');
  assert.equal(duplicate.severity, 'warning');
  assert.equal(duplicate.count, 1);
});

test('empty rows are not counted as missing identifiers, dates or localities', () => {
  const result = check('empty-and-duplicate-rows.csv');
  assert.ok(!codes(result).includes('missing-identifier'));
  assert.ok(!codes(result).includes('missing-locality'));
  assert.ok(!codes(result).includes('missing-date'));
});

test('an unrecognisable file says so instead of guessing an identifier', () => {
  const result = check('no-identifier-column.csv');
  assert.equal(result.detection.identifier, undefined);
  assert.deepEqual(result.detection.columns, []);
  assert.deepEqual(result.detection.unrecognisedHeaders, ['Thing', 'Where', 'When']);
  const finding = found(result, 'no-identifier-column');
  assert.equal(finding.severity, 'warning');
  assert.equal(result.errorCount, 0);
});

test('other reasonable column names are recognised, with a semicolon-separated file', () => {
  const result = check('alias-variants-semicolon.csv');
  assert.equal(result.delimiter, ';');
  const recognised = new Map(result.detection.columns.map((c) => [c.concept.id, c.header]));
  assert.equal(recognised.get('catalogNumber'), 'Specimen No');
  assert.equal(recognised.get('locality'), 'Site Name');
  assert.equal(recognised.get('latitude'), 'Lat');
  assert.equal(recognised.get('longitude'), 'Long');
  assert.equal(recognised.get('eventDate'), 'Date Collected');
  assert.equal(recognised.get('collector'), 'Collected By');
  assert.deepEqual(codes(result), []);
});

test('rows with the wrong number of values are errors that explain the shift', () => {
  const result = check('ragged-rows.csv');
  const finding = found(result, 'wrong-number-of-values');
  assert.equal(finding.severity, 'error');
  assert.equal(finding.count, 2);
  assert.ok(finding.examples.some((e) => e.includes('line 3')));
  assert.ok(finding.note?.includes('wrong column'));
});

test('errors are listed before warnings', () => {
  const severities = check('duplicate-identifiers.csv').findings.map((f) => f.severity);
  assert.deepEqual(severities, [...severities].sort());
});

test('a column heading padded with spaces is reported and still recognised', () => {
  const table = parseCsv('  CatalogNumber  ,Locality\nX-1,Site\n', ',');
  const result = validate('inline.csv', table);
  const finding = found(result, 'untidy-column-heading');
  assert.equal(finding.severity, 'warning');
  assert.equal(result.detection.identifier?.header, '  CatalogNumber  ');
});

test('repeated and blank column headings are reported', () => {
  const table = parseCsv('CatalogNumber,Locality,CatalogNumber,\nA,B,C,D\n', ',');
  const result = validate('inline.csv', table);
  assert.equal(found(result, 'duplicate-column-heading').severity, 'error');
  assert.equal(found(result, 'blank-column-heading').severity, 'warning');
});

test('a column that holds numbers almost everywhere is flagged where it does not', () => {
  const rows = Array.from({ length: 12 }, (_, i) => `X-${i},Site,${10 + i}`).join('\n');
  const table = parseCsv(`CatalogNumber,Locality,LengthMm\n${rows}\nX-99,Site,about 12\n`, ',');
  const finding = found(validate('inline.csv', table), 'mixed-values-in-column');
  assert.equal(finding.severity, 'warning');
  assert.equal(finding.count, 1);
  assert.ok(finding.examples[0]?.includes('about 12'));
});

test('a short column is left alone rather than guessed at', () => {
  const table = parseCsv('CatalogNumber,Locality,LengthMm\nX-1,Site,10\nX-2,Site,unknown\n', ',');
  const result = validate('inline.csv', table);
  assert.ok(!codes(result).includes('mixed-values-in-column'));
});
