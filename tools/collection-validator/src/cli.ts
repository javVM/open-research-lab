/**
 * Command-line entry point. Read-only: it opens the file, reads it, and writes nothing
 * back. The only file it ever writes is a JSON report you explicitly asked for.
 *
 * Exit codes: 0 nothing wrong, 1 errors found, 2 the file could not be processed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { CsvError, detectDelimiter, parseCsv, SUPPORTED_DELIMITERS } from './csv.ts';
import { renderJsonReport, renderTextReport } from './report.ts';
import { validate } from './validation.ts';

const USAGE = `
Collection data check — experimental Open Research Lab prototype

  Looks through a CSV export from a spreadsheet or collection management system and
  reports problems a person should look at. It never changes your file.

Usage
  npm run validate -- <file.csv> [options]

Options
  --delimiter <char>   Column separator: , ; | or "tab". Guessed from the file if omitted.
  --json [path]        Also write a machine-readable report (to the screen if no path given).
  --quiet              Only write the JSON report, no readable report.
  -h, --help           This text.

Exit codes
  0  no errors found
  1  errors found
  2  the file could not be read or understood
`.trimStart();

interface Options {
  file: string;
  delimiter: string | undefined;
  json: 'none' | 'stdout' | string;
  quiet: boolean;
}

export function parseArguments(argv: readonly string[]): Options | 'help' {
  const options: Options = { file: '', delimiter: undefined, json: 'none', quiet: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    if (arg === '-h' || arg === '--help') return 'help';
    if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '--delimiter') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('--delimiter needs a value, for example --delimiter ";"');
      options.delimiter = value === 'tab' ? '\t' : value;
      i += 1;
    } else if (arg === '--json') {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('-')) {
        options.json = 'stdout';
      } else {
        options.json = next;
        i += 1;
      }
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option "${arg}". Run with --help to see the options.`);
    } else if (options.file === '') {
      options.file = arg;
    } else {
      throw new Error('Please give exactly one CSV file.');
    }
  }

  if (options.file === '') throw new Error('Please give the CSV file to check.');
  if (options.delimiter !== undefined && !SUPPORTED_DELIMITERS.includes(options.delimiter as never)) {
    throw new Error('The delimiter must be one of , ; | or the word "tab".');
  }
  if (options.quiet && options.json === 'none') {
    throw new Error('--quiet only makes sense together with --json.');
  }
  return options;
}

export function main(argv: readonly string[]): number {
  let options: Options | 'help';
  try {
    options = parseArguments(argv);
  } catch (error) {
    process.stderr.write(`${messageOf(error)}\n`);
    return 2;
  }
  if (options === 'help') {
    process.stdout.write(USAGE);
    return 0;
  }

  let text: string;
  try {
    text = readFileSync(options.file, 'utf8');
  } catch (error) {
    process.stderr.write(`Could not read "${options.file}": ${messageOf(error)}\n`);
    return 2;
  }

  let result;
  try {
    const delimiter = options.delimiter ?? detectDelimiter(text);
    result = validate(options.file, parseCsv(text, delimiter));
  } catch (error) {
    if (error instanceof CsvError) {
      process.stderr.write(`This file could not be read as a CSV table.\n${error.message}\n`);
      return 2;
    }
    throw error;
  }

  if (!options.quiet) process.stdout.write(renderTextReport(result));
  if (options.json === 'stdout') {
    process.stdout.write(renderJsonReport(result));
  } else if (options.json !== 'none') {
    try {
      writeFileSync(options.json, renderJsonReport(result), 'utf8');
      if (!options.quiet) process.stdout.write(`Machine-readable report written to ${options.json}\n`);
    } catch (error) {
      process.stderr.write(`Could not write "${options.json}": ${messageOf(error)}\n`);
      return 2;
    }
  }

  return result.errorCount > 0 ? 1 : 0;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exitCode = main(process.argv.slice(2));
}
