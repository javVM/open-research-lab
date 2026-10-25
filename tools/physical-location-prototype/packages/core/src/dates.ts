import type { PartialDate } from './model.js';

/**
 * Partial-date parsing (invariant: "imprecise dates are legitimate data — model
 * precision, do not guess a day"). The verbatim text is always preserved; only
 * the precision that is actually present is recorded.
 */

const FULL = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
const YEAR = /^(\d{4})$/;

/** Parse an ISO-shaped date string into a `PartialDate`, or `null` if unparseable. */
export function parsePartialDate(verbatim: string): PartialDate | null {
  const text = verbatim.trim();
  const full = FULL.exec(text);
  if (full) {
    const year = Number(full[1]);
    const month = Number(full[2]);
    const day = Number(full[3]);
    if (!isValidYearMonthDay(year, month, day)) {
      return null;
    }
    return { verbatim: text, year, month, day, precision: 'day' };
  }

  const monthOnly = MONTH.exec(text);
  if (monthOnly) {
    const year = Number(monthOnly[1]);
    const month = Number(monthOnly[2]);
    if (year < 0 || month < 1 || month > 12) {
      return null;
    }
    return { verbatim: text, year, month, precision: 'month' };
  }

  const yearOnly = YEAR.exec(text);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    if (year < 0) {
      return null;
    }
    return { verbatim: text, year, precision: 'year' };
  }

  return null;
}

function isValidYearMonthDay(year: number, month: number, day: number): boolean {
  if (year < 0 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/** Render a `PartialDate` back to a normalised ISO-ish string for export. */
export function formatPartialDate(date: PartialDate): string {
  const month = date.month ? String(date.month).padStart(2, '0') : '';
  const day = date.day ? String(date.day).padStart(2, '0') : '';
  switch (date.precision) {
    case 'day':
      return `${date.year}-${month}-${day}`;
    case 'month':
      return `${date.year}-${month}`;
    case 'year':
      return `${date.year}`;
  }
}
