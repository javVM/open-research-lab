import { describe, expect, it } from 'vitest';
import { parseCsv, stringifyCsv } from './csv.js';

describe('parseCsv', () => {
  it('parses a simple header + rows', () => {
    const parsed = parseCsv('code,name\nA,Alpha\nB,Beta\n');
    expect(parsed.headers).toEqual(['code', 'name']);
    expect(parsed.rows).toEqual([
      { rowNumber: 2, fields: ['A', 'Alpha'] },
      { rowNumber: 3, fields: ['B', 'Beta'] },
    ]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    const parsed = parseCsv('code,notes\nA,"a, b, c"\nB,"he said ""hi"""\n');
    expect(parsed.rows[0]!.fields[1]).toBe('a, b, c');
    expect(parsed.rows[1]!.fields[1]).toBe('he said "hi"');
  });

  it('handles newlines inside quoted fields and tracks line numbers', () => {
    const parsed = parseCsv('code,notes\nA,"line1\nline2"\nB,x\n');
    expect(parsed.rows[0]!.fields[1]).toBe('line1\nline2');
    expect(parsed.rows[1]!.rowNumber).toBe(4);
  });

  it('ignores a trailing newline without producing an empty row', () => {
    const parsed = parseCsv('code\nA\n');
    expect(parsed.rows).toHaveLength(1);
  });

  it('returns empty structure for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });
});

describe('stringifyCsv', () => {
  it('round-trips through the parser', () => {
    const headers = ['code', 'name'];
    const rows = [
      ['A', 'Alpha'],
      ['B', 'a, b'],
      ['C', 'said "hi"'],
    ];
    const reparsed = parseCsv(stringifyCsv(headers, rows));
    expect(reparsed.headers).toEqual(headers);
    expect(reparsed.rows.map((r) => r.fields)).toEqual(rows);
  });
});
