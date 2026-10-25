import { describe, expect, it } from 'vitest';
import { formatPartialDate, parsePartialDate } from './dates.js';

describe('parsePartialDate', () => {
  it('parses full dates with day precision', () => {
    expect(parsePartialDate('2024-07-15')).toEqual({
      verbatim: '2024-07-15',
      year: 2024,
      month: 7,
      day: 15,
      precision: 'day',
    });
  });

  it('parses month-precision dates without inventing a day', () => {
    expect(parsePartialDate('1998-07')).toEqual({
      verbatim: '1998-07',
      year: 1998,
      month: 7,
      precision: 'month',
    });
  });

  it('parses year-precision dates', () => {
    expect(parsePartialDate('1870')).toEqual({ verbatim: '1870', year: 1870, precision: 'year' });
  });

  it('trims surrounding whitespace and preserves the trimmed verbatim', () => {
    expect(parsePartialDate('  2024-07  ')).toMatchObject({ year: 2024, month: 7 });
  });

  it('rejects impossible calendar dates', () => {
    expect(parsePartialDate('2024-02-30')).toBeNull();
    expect(parsePartialDate('2024-13-01')).toBeNull();
    expect(parsePartialDate('2024-00-10')).toBeNull();
  });

  it('rejects free text that is not an ISO-shaped date', () => {
    expect(parsePartialDate('circa 1870')).toBeNull();
    expect(parsePartialDate('unknown')).toBeNull();
  });
});

describe('formatPartialDate', () => {
  it('renders each precision back to a normalised string', () => {
    expect(formatPartialDate({ verbatim: 'x', year: 2024, month: 7, day: 5, precision: 'day' })).toBe(
      '2024-07-05',
    );
    expect(formatPartialDate({ verbatim: 'x', year: 1998, month: 7, precision: 'month' })).toBe(
      '1998-07',
    );
    expect(formatPartialDate({ verbatim: 'x', year: 1870, precision: 'year' })).toBe('1870');
  });
});
