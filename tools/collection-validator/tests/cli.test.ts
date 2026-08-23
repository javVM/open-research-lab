import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
const fixture = (name: string): string => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

function run(args: readonly string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
}

test('a clean file exits 0 and says nothing was found', () => {
  const result = run([fixture('clean.csv')]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Columns we recognised/);
  assert.match(result.stdout, /catalogue number {2}->\s+"CatalogNumber"/);
  assert.match(result.stdout, /None of our checks found a problem/);
  assert.match(result.stdout, /errors: {3}0/);
});

test('a file with errors exits 1 and shows the errors before the warnings', () => {
  const result = run([fixture('duplicate-identifiers.csv')]);
  assert.equal(result.status, 1);
  const firstError = result.stdout.indexOf('ERROR');
  const firstWarning = result.stdout.indexOf('WARNING');
  assert.ok(firstError > -1);
  if (firstWarning > -1) assert.ok(firstError < firstWarning);
});

test('a file with only warnings exits 0', () => {
  assert.equal(run([fixture('missing-locality.csv')]).status, 0);
});

test('a missing file exits 2 with a readable message and no report', () => {
  const result = run([join(tmpdir(), 'does-not-exist-12345.csv')]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Could not read/);
  assert.equal(result.stdout, '');
});

test('a file that is not a CSV table exits 2 instead of reporting nonsense', () => {
  const broken = join(mkdtempSync(join(tmpdir(), 'cv-')), 'broken.csv');
  writeFileSync(broken, 'a,b\n"unclosed,value\n', 'utf8');
  const result = run([broken]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /could not be read as a CSV table/);
});

test('--help explains the tool and exits 0', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /never changes your file/);
});

test('an unknown option exits 2 and points at --help', () => {
  const result = run([fixture('clean.csv'), '--wat']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--help/);
});

test('the input file is never modified', () => {
  const path = fixture('duplicate-identifiers.csv');
  const before = readFileSync(path, 'utf8');
  const stat = statSync(path);
  run([path, '--json']);
  assert.equal(readFileSync(path, 'utf8'), before);
  assert.equal(statSync(path).mtimeMs, stat.mtimeMs);
});

test('--json writes a machine-readable report to the given path', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'cv-')), 'report.json');
  const result = run([fixture('bad-coordinates.csv'), '--json', out]);
  assert.equal(result.status, 1);

  const report = JSON.parse(readFileSync(out, 'utf8')) as {
    experimental: boolean;
    identifierColumn: string;
    summary: { errors: number; warnings: number };
    findings: { code: string; severity: string }[];
    detectedColumns: { concept: string; header: string; reason: string }[];
  };
  assert.equal(report.experimental, true);
  assert.equal(report.identifierColumn, 'catalog no');
  assert.ok(report.summary.errors > 0);
  assert.ok(report.findings.some((f) => f.code === 'latitude-out-of-range' && f.severity === 'error'));
  assert.ok(report.detectedColumns.every((c) => c.reason.length > 0));
});

test('--quiet --json prints only the JSON report', () => {
  const result = run([fixture('clean.csv'), '--quiet', '--json']);
  assert.equal(result.status, 0);
  assert.doesNotThrow(() => JSON.parse(result.stdout));
});

test('--delimiter overrides the guess', () => {
  const result = run([fixture('alias-variants-semicolon.csv'), '--delimiter', ';']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /separated by semicolon/);
});
