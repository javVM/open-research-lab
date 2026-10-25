/**
 * A minimal RFC-4180-style CSV reader and writer. Written here (not imported)
 * because a correct-enough parser for quoted fields, embedded commas and
 * embedded newlines is small, and the CLI has no business dragging in a
 * dependency for it.
 */

export interface CsvRow {
  /** 1-based physical line number of the record (header row is line 1). */
  rowNumber: number;
  fields: string[];
}

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
}

export function parseCsv(text: string): ParsedCsv {
  const records: CsvRow[] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let lineNumber = 1;
  let recordStartLine = 1;

  const pushField = (): void => {
    fields.push(field);
    field = '';
  };
  const pushRecord = (): void => {
    records.push({ rowNumber: recordStartLine, fields });
    fields = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
        if (ch === '\n') {
          lineNumber++;
        }
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\n') {
      pushField();
      pushRecord();
      lineNumber++;
      recordStartLine = lineNumber;
    } else if (ch === '\r') {
      // Ignore: \r\n is handled by the \n branch.
    } else {
      field += ch;
    }
  }

  if (field !== '' || fields.length > 0) {
    pushField();
    pushRecord();
  }

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }
  return { headers: records[0]!.fields, rows: records.slice(1) };
}

export function stringifyCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string): string =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return `${lines.join('\n')}\n`;
}
