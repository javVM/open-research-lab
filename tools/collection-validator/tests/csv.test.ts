import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CsvError, detectDelimiter, parseCsv } from '../src/csv.ts';

test('quoted values may contain the delimiter and line breaks', () => {
  const table = parseCsv('a,b\n"Teruel, Spain","two\nlines"\n', ',');
  assert.deepEqual(table.header, ['a', 'b']);
  assert.deepEqual(table.rows[0]?.values, ['Teruel, Spain', 'two\nlines']);
});

test('doubled quotes inside a quoted value are one quote', () => {
  const table = parseCsv('a\n"say ""hello"""\n', ',');
  assert.deepEqual(table.rows[0]?.values, ['say "hello"']);
});

test('a byte order mark and CRLF line endings are handled', () => {
  const table = parseCsv('\ufeffCatalogNumber,Locality\r\nA-1,Site\r\n', ',');
  assert.deepEqual(table.header, ['CatalogNumber', 'Locality']);
  assert.equal(table.rows.length, 1);
});

test('line numbers refer to the line in the file, including multi-line values', () => {
  const table = parseCsv('a,b\nx,"one\ntwo"\ny,z\n', ',');
  assert.equal(table.rows[0]?.line, 2);
  assert.equal(table.rows[1]?.line, 4);
});

test('an unclosed quote is refused with an explanation, not a wrong answer', () => {
  assert.throws(() => parseCsv('a,b\n"unclosed,value\n', ','), (error: unknown) => {
    assert.ok(error instanceof CsvError);
    assert.match(error.message, /never closed/);
    return true;
  });
});

test('an empty file is refused', () => {
  assert.throws(() => parseCsv('   \n', ','), CsvError);
});

test('the delimiter is guessed from the heading row, and comma wins ties', () => {
  assert.equal(detectDelimiter('a;b;c\n1;2;3\n'), ';');
  assert.equal(detectDelimiter('a\tb\tc\n'), '\t');
  assert.equal(detectDelimiter('a,b;c\n'), ',');
  assert.equal(detectDelimiter('"a;b",c\n'), ',');
});
