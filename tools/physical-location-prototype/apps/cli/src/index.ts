#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { newUlid } from '@sample-operations/core';
import {
  nodeUlidSource,
  openDatabase,
  seedContainerTypes,
  seedItemTypes,
} from '@sample-operations/persistence-sqlite';
import { parseCsv } from './csv.js';
import { exportItemsCsv } from './export.js';
import { parseMappingConfig, resolveMapping } from './fields.js';
import { applyPlan, planImport } from './import.js';
import { validateRows, type ImportIssue } from './validate.js';

const USAGE = `Sample Operations — import/validate/export pipeline

Usage:
  sample-ops init <db>
  sample-ops validate <csv> [--mapping <json>]
  sample-ops import <csv> --db <db> [--mapping <json>] [--actor <name>]
  sample-ops export --db <db> [--out <csv>]

Commands:
  init       Create a database file and seed the default vocabularies.
  validate   Report problems in a CSV without touching any database.
  import     Validate (dry run) and then apply a CSV in one transaction.
  export     Write the database back out as CSV (round-trips through import).
`;

interface Args {
  command: string | null;
  positional: string[];
  flags: Map<string, string>;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags.set(name, next);
        i++;
      } else {
        flags.set(name, '');
      }
    } else {
      positional.push(arg);
    }
  }
  return { command: positional[0] ?? null, positional: positional.slice(1), flags };
}

function readFile(path: string): string {
  return readFileSync(path, 'utf8');
}

function printIssues(issues: ImportIssue[]): void {
  for (const issue of issues) {
    const column = issue.column ? ` (column "${issue.column}")` : '';
    console.log(`  row ${issue.row}${column}: ${issue.reason}`);
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

function main(): void {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  if (command === null || command === '--help' || command === 'help') {
    console.log(USAGE);
    return;
  }

  const newId = (): string => newUlid(nodeUlidSource);

  switch (command) {
    case 'init': {
      const dbPath = positional[0];
      if (!dbPath) fail('init requires a database path');
      const db = openDatabase(dbPath);
      seedContainerTypes(db);
      seedItemTypes(db, newId);
      db.close();
      console.log(`Created database: ${dbPath}`);
      return;
    }

    case 'validate': {
      const csvPath = positional[0];
      if (!csvPath) fail('validate requires a CSV path');
      const mapping = flags.has('mapping')
        ? parseMappingConfig(readFile(flags.get('mapping')!))
        : undefined;
      const parsed = parseCsv(readFile(csvPath));
      const resolved = resolveMapping(parsed.headers, mapping);
      const issues = validateRows(parsed, resolved);
      if (issues.length === 0) {
        console.log('OK — no problems found.');
        return;
      }
      console.log(`Found ${issues.length} problem(s):`);
      printIssues(issues);
      process.exitCode = 1;
      return;
    }

    case 'import': {
      const csvPath = positional[0];
      const dbPath = flags.get('db');
      if (!csvPath) fail('import requires a CSV path');
      if (!dbPath) fail('import requires --db <path>');
      const mapping = flags.has('mapping')
        ? parseMappingConfig(readFile(flags.get('mapping')!))
        : undefined;
      const actorName = flags.get('actor') ?? 'operator';

      const parsed = parseCsv(readFile(csvPath));
      const resolved = resolveMapping(parsed.headers, mapping);

      const db = openDatabase(dbPath);
      seedContainerTypes(db);
      seedItemTypes(db, newId);

      const deps = { newId, now: () => new Date().toISOString(), actorName };
      const result = planImport(db, parsed, resolved, deps, csvPath);

      if (result.issues.length > 0 || result.plan === null) {
        console.log(`Nothing was written. Found ${result.issues.length} problem(s):`);
        printIssues(result.issues);
        db.close();
        process.exitCode = 1;
        return;
      }

      applyPlan(db, result.plan);
      db.close();
      console.log(
        `Imported ${result.plan.importedCount} item(s), created ${result.plan.createdContainers} container(s).`,
      );
      return;
    }

    case 'export': {
      const dbPath = flags.get('db');
      if (!dbPath) fail('export requires --db <path>');
      const db = openDatabase(dbPath);
      const csv = exportItemsCsv(db);
      db.close();
      const out = flags.get('out');
      if (out) {
        writeFileSync(out, csv);
        console.log(`Wrote ${out}`);
      } else {
        process.stdout.write(csv);
      }
      return;
    }

    default:
      fail(`unknown command: ${command}`);
  }
}

main();
