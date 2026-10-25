import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.js';
import { resolveMapping } from './fields.js';
import { validateRows } from './validate.js';

function issues(csv: string) {
  const parsed = parseCsv(csv);
  const mapping = resolveMapping(parsed.headers);
  return validateRows(parsed, mapping);
}

describe('validateRows', () => {
  it('accepts a clean file', () => {
    const result = issues('code,name\nA,Alpha\n');
    expect(result).toEqual([]);
  });

  it('reports a missing code', () => {
    const result = issues('code,name\n,Alpha\n');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ row: 2, reason: 'code is required' });
  });

  it('reports a duplicate code within the file', () => {
    const result = issues('code\nA\nA\n');
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toMatch(/duplicate code "A"/);
  });

  it('reports a quantity value without a unit', () => {
    const result = issues('code,quantityValue\nA,50\n');
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toMatch(/no unit/);
  });

  it('reports an unparseable date', () => {
    const result = issues('code,collectedAt\nA,circa 1870\n');
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toMatch(/not a recognised/);
  });

  it('reports latitude without longitude', () => {
    const result = issues('code,latitude\nA,40.1\n');
    expect(result).toHaveLength(1);
    expect(result[0]!.reason).toMatch(/together/);
  });

  it('reports an out-of-range coordinate', () => {
    const result = issues('code,latitude,longitude\nA,91,0\n');
    expect(result[0]!.reason).toMatch(/latitude out of range/);
  });

  it('reports an unknown status', () => {
    const result = issues('code,status\nA,exploded\n');
    expect(result[0]!.reason).toMatch(/unknown status/);
  });

  it('reports a position without a container path', () => {
    const result = issues('code,position\nA,C4\n');
    expect(result[0]!.reason).toMatch(/position provided without a container path/);
  });
});
