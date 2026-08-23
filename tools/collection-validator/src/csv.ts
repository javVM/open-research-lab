/**
 * Minimal CSV reader. Handles quoted fields, embedded delimiters, embedded newlines,
 * doubled quotes, CRLF, and a UTF-8 byte order mark.
 *
 * Deliberately not a general CSV library: no streaming, no type coercion, no options
 * beyond the delimiter. Everything comes back as strings, exactly as written in the file.
 */

export interface CsvRow {
  /** Line number in the file where this record starts, 1-based, counting the header. */
  readonly line: number;
  readonly values: readonly string[];
}

export interface CsvTable {
  readonly header: readonly string[];
  readonly rows: readonly CsvRow[];
  readonly delimiter: string;
}

export const SUPPORTED_DELIMITERS = [',', ';', '\t', '|'] as const;

const DELIMITER_NAMES: Record<string, string> = {
  ',': 'comma',
  ';': 'semicolon',
  '\t': 'tab',
  '|': 'pipe',
};

export function describeDelimiter(delimiter: string): string {
  return DELIMITER_NAMES[delimiter] ?? JSON.stringify(delimiter);
}

export class CsvError extends Error {}

/**
 * Guesses the delimiter from the first line by counting candidates outside quotes.
 * Comma wins ties, because a comma-delimited file is the overwhelmingly likely case
 * and guessing wrong is worse than guessing boringly.
 */
export function detectDelimiter(text: string): string {
  const firstLine = firstPhysicalLine(stripBom(text));
  let best = ',';
  let bestCount = 0;
  for (const candidate of SUPPORTED_DELIMITERS) {
    const count = countOutsideQuotes(firstLine, candidate);
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter: string): CsvTable {
  if (delimiter.length !== 1) {
    throw new CsvError('The delimiter must be a single character.');
  }
  const source = stripBom(text);
  if (source.trim() === '') {
    throw new CsvError('The file is empty.');
  }

  const records: { line: number; values: string[] }[] = [];
  let values: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordStartLine = 1;
  let sawAnyCharacterInRecord = false;

  const endField = (): void => {
    values.push(field);
    field = '';
  };
  const endRecord = (): void => {
    endField();
    records.push({ line: recordStartLine, values });
    values = [];
    sawAnyCharacterInRecord = false;
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i] as string;
    if (!sawAnyCharacterInRecord) {
      recordStartLine = line;
      sawAnyCharacterInRecord = true;
    }

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === '\n') line += 1;
        field += char;
      }
      continue;
    }

    if (char === '"' && field === '') {
      inQuotes = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === '\r') {
      // Swallow; the following \n ends the record. A lone \r also ends it.
      if (source[i + 1] !== '\n') {
        endRecord();
        line += 1;
      }
    } else if (char === '\n') {
      endRecord();
      line += 1;
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new CsvError(
      `A quoted value starting on line ${recordStartLine} is never closed — there is an odd number of double quotes in the file.`,
    );
  }
  if (sawAnyCharacterInRecord || field !== '') {
    endRecord();
  }

  const headerRecord = records.shift();
  if (headerRecord === undefined) {
    throw new CsvError('The file has no header row.');
  }

  return {
    header: headerRecord.values,
    rows: records.map((record) => ({ line: record.line, values: record.values })),
    delimiter,
  };
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function firstPhysicalLine(text: string): string {
  const end = text.search(/\r|\n/);
  return end === -1 ? text : text.slice(0, end);
}

function countOutsideQuotes(text: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) count += 1;
  }
  return count;
}
