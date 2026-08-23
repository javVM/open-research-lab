/**
 * Report rendering. Two formats: a terminal report meant to be read by a collection
 * manager, and a JSON document meant to be read by a program.
 */

import { describeDelimiter } from './csv.ts';
import type { Finding, ValidationResult } from './validation.ts';

const MAX_EXAMPLES_SHOWN = 5;

export function renderTextReport(result: ValidationResult): string {
  const lines: string[] = [];
  const push = (line = ''): void => void lines.push(line);

  push('Collection data check');
  push('=====================');
  push();
  push(`File:    ${result.file}`);
  push(`Rows:    ${formatNumber(result.rowCount)} (not counting the heading row)`);
  push(`Columns: ${formatNumber(result.columnCount)}, separated by ${describeDelimiter(result.delimiter)}`);
  push();

  push('Columns we recognised');
  push('---------------------');
  if (result.detection.columns.length === 0) {
    push('  None. We did not recognise any of the column headings, so only the general checks');
    push('  (empty rows, repeated rows, row shape) were run.');
  } else {
    const width = Math.max(...result.detection.columns.map((c) => c.concept.label.length));
    for (const column of result.detection.columns) {
      push(`  ${column.concept.label.padEnd(width)}  ->  "${column.header}"`);
      push(`  ${' '.repeat(width)}      because ${column.reason}`);
    }
  }
  if (result.detection.identifier !== undefined) {
    push();
    push(`  Records are identified by "${result.detection.identifier.header}".`);
  }
  if (result.detection.unrecognisedHeaders.length > 0) {
    push();
    push('  Not recognised, and therefore not checked:');
    for (const chunk of chunkList(result.detection.unrecognisedHeaders, 4)) {
      push(`    ${chunk.map((header) => `"${header}"`).join(', ')}`);
    }
  }
  push();

  push('What we found');
  push('-------------');
  if (result.findings.length === 0) {
    push('  Nothing. None of our checks found a problem.');
    push('  That is not the same as the data being correct — see the README for what we do not check.');
  } else {
    for (const found of result.findings) {
      push(`  ${label(found)}  ${found.message}`);
    }
  }
  push();

  const withExamples = result.findings.filter((found) => found.examples.length > 0);
  if (withExamples.length > 0) {
    push('Details');
    push('-------');
    for (const found of withExamples) {
      push(`  ${label(found)}  ${found.message}`);
      if (found.note !== undefined) push(`          ${found.note}`);
      for (const example of found.examples.slice(0, MAX_EXAMPLES_SHOWN)) {
        push(`            ${example}`);
      }
      const hidden = found.count - Math.min(found.examples.length, MAX_EXAMPLES_SHOWN);
      if (hidden > 0) push(`            ... and ${formatNumber(hidden)} more`);
      push();
    }
  }

  push('Summary');
  push('-------');
  push(`  errors:   ${formatNumber(result.errorCount)}   (definitely wrong, or impossible)`);
  push(`  warnings: ${formatNumber(result.warningCount)}   (suspicious — only you can judge)`);
  push();
  push('This is an experimental tool. It has not changed your file, and it does not claim your');
  push('data is correct or that it meets any published standard.');
  push();

  return lines.join('\n');
}

export function renderJsonReport(result: ValidationResult): string {
  return `${JSON.stringify(
    {
      tool: 'collection-validator',
      toolVersion: '0.0.1',
      experimental: true,
      file: result.file,
      rowCount: result.rowCount,
      columnCount: result.columnCount,
      delimiter: result.delimiter,
      detectedColumns: result.detection.columns.map((column) => ({
        concept: column.concept.id,
        label: column.concept.label,
        header: column.header,
        columnIndex: column.index,
        reason: column.reason,
        alsoMatched: column.alsoMatched.map((other) => other.header),
      })),
      identifierColumn: result.detection.identifier?.header ?? null,
      unrecognisedHeaders: result.detection.unrecognisedHeaders,
      findings: result.findings.map((found) => ({
        severity: found.severity,
        code: found.code,
        message: found.message,
        count: found.count,
        examples: found.examples,
        note: found.note ?? null,
      })),
      summary: { errors: result.errorCount, warnings: result.warningCount },
    },
    null,
    2,
  )}\n`;
}

function label(found: Finding): string {
  return found.severity === 'error' ? 'ERROR  ' : 'WARNING';
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function chunkList<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
