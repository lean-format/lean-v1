#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, basename, join as joinPath } from 'node:path';
import { Command } from 'commander';
import { parse, format, validate, diff, formatDiff, query, generateSchema, initParser } from '@lean-format/core';
import yaml from 'js-yaml';
import toml from '@iarna/toml';

const program = new Command();

program
  .name('lean')
  .description('LEAN Format CLI — Lightweight Efficient Adaptive Notation')
  .version('2.0.0');

// ── parse ──────────────────────────────────────────────────────────────
program
  .command('parse')
  .description('Parse LEAN file to JSON')
  .argument('[file]', 'LEAN file to parse (stdin if omitted)')
  .option('--strict', 'Enable strict mode')
  .option('-o, --output <file>', 'Output file (stdout if omitted)')
  .option('--pretty', 'Pretty-print JSON output')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file, opts) => {
    await ensureInit();
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    try {
      const result = parse(content, { strict: opts.strict });
      const json = opts.pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
      output(json, opts.output);
      if (!opts.quiet) log(`✓ Parsed ${file || 'stdin'} → ${opts.output || 'stdout'}`);
    } catch (err: any) {
      error(`Parse error: ${err.message}`);
      process.exit(1);
    }
  });

// ── format ─────────────────────────────────────────────────────────────
program
  .command('format')
  .description('Format JSON as LEAN')
  .argument('[file]', 'JSON file (stdin if omitted)')
  .option('--indent <n>', 'Indentation: 2, 4, or tab', '2')
  .option('--no-row-syntax', 'Disable row syntax')
  .option('--row-threshold <n>', 'Minimum items for row syntax', '4')
  .option('--sort-keys', 'Sort keys alphabetically')
  .option('-o, --output <file>', 'Output file')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file, opts) => {
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    try {
      const obj = JSON.parse(content);
      const indent = opts.indent === 'tab' ? '\t' : ' '.repeat(parseInt(opts.indent) || 2);
      const result = format(obj, {
        indent,
        useRowSyntax: opts.rowSyntax !== false,
        rowThreshold: parseInt(opts.rowThreshold) || 4,
        sortKeys: opts.sortKeys ?? false,
      });
      output(result, opts.output);
      if (!opts.quiet) log(`✓ Formatted ${file || 'stdin'} → ${opts.output || 'stdout'}`);
    } catch (err: any) {
      error(`Format error: ${err.message}`);
      process.exit(1);
    }
  });

// ── validate ───────────────────────────────────────────────────────────
program
  .command('validate')
  .description('Validate LEAN syntax')
  .argument('[file]', 'LEAN file to validate (stdin if omitted)')
  .option('--strict', 'Enable strict mode')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file, opts) => {
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    try {
      const result = validate(content, { strict: opts.strict });
      if (result.valid) {
        log(`✓ ${file || 'stdin'} is valid LEAN format` + (opts.strict ? ' (strict mode)' : ''));
      } else {
        for (const err of result.errors) {
          const loc = err.line ? `Line ${err.line}${err.column ? `:${err.column}` : ''}` : '?';
          error(`✗ ${loc}: ${err.message}`);
          if (err.suggestion) error(`  Suggestion: ${err.suggestion}`);
        }
        process.exit(1);
      }
    } catch (err: any) {
      error(`✗ Validation error: ${err.message}`);
      process.exit(1);
    }
  });

// ── compile ────────────────────────────────────────────────────────────
program
  .command('compile')
  .description('Compile LEAN to JSON, YAML, TOML, and .env')
  .argument('[file]', 'LEAN file (stdin if omitted)')
  .option('--strict', 'Enable strict mode')
  .option('--format <formats>', 'Comma-separated: json,yaml,toml,env', 'json,yaml,toml,env')
  .option('-d, --output-dir <dir>', 'Output directory (default: same as input file / cwd for stdin)')
  .option('--force', 'Overwrite existing output files without prompting')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file, opts) => {
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    const baseName = file ? file.replace(/\.lean$/, '') : 'config';
    const outDir = opts.outputDir || (file ? dirname(file) : process.cwd());
    mkdirSync(outDir, { recursive: true });

    try {
      const data = parse(content, { strict: opts.strict });
      const formats = opts.format.split(',').map((f: string) => f.trim().toLowerCase());

      const outputs: string[] = [];

      const obj = data as Record<string, unknown>;
      for (const fmt of formats) {
        const ext = fmt === 'env' ? '.env' : `.${fmt}`;
        const outFile = joinPath(outDir, `${basename(baseName)}${ext}`);

        if (!opts.force && existsSync(outFile)) {
          error(`✗ ${outFile} already exists. Use --force to overwrite.`);
          process.exit(1);
        }

        let outContent = '';
        if (fmt === 'json') {
          outContent = JSON.stringify(obj, null, 2);
        } else if (fmt === 'yaml') {
          outContent = toYaml(obj);
        } else if (fmt === 'toml') {
          outContent = toToml(obj);
        } else if (fmt === 'env') {
          outContent = toEnv(obj);
        }
        writeFileSync(outFile, outContent);
        outputs.push(outFile);
      }

      if (!opts.quiet) {
        log(`✓ Compiled ${file || 'stdin'} to:`);
        for (const out of outputs) log(`  - ${out}`);
      }
    } catch (err: any) {
      error(`✗ Compile error: ${err.message}`);
      process.exit(1);
    }
  });

// ── diff ───────────────────────────────────────────────────────────────
program
  .command('diff')
  .description('Show structural differences between two LEAN files')
  .argument('<file1>', 'First LEAN file')
  .argument('<file2>', 'Second LEAN file')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file1, file2, _opts) => {
    await ensureInit();
    try {
      const content1 = readFileSync(file1, 'utf-8');
      const content2 = readFileSync(file2, 'utf-8');
      const data1 = parse(content1);
      const data2 = parse(content2);
      const entries = diff(data1, data2);

      if (entries.length === 0) {
        log('✓ Files are identical');
      } else {
        log(formatDiff(entries));
      }
    } catch (err: any) {
      error(`✗ Diff error: ${err.message}`);
      process.exit(1);
    }
  });

// ── query ──────────────────────────────────────────────────────────────
program
  .command('query')
  .description('Query a LEAN file using dot-separated path')
  .argument('<file>', 'LEAN file')
  .argument('<path>', 'Query path (e.g., "users[0].name")')
  .option('--pretty', 'Pretty-print output')
  .action(async (file, path, opts) => {
    await ensureInit();
    try {
      const content = readFileSync(file, 'utf-8');
      const data = parse(content);
      const result = query(data, path);

      if (!result.exists) {
        error(`✗ Path '${path}' not found in data`);
        process.exit(1);
      }

      const json = opts.pretty ? JSON.stringify(result.value, null, 2) : JSON.stringify(result.value);
      log(json);
    } catch (err: any) {
      error(`✗ Query error: ${err.message}`);
      process.exit(1);
    }
  });

// ── schema ─────────────────────────────────────────────────────────────
program
  .command('schema')
  .description('Generate JSON Schema from sample LEAN data')
  .argument('<file>', 'LEAN file to analyze')
  .option('-o, --output <file>', 'Output file')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file, opts) => {
    await ensureInit();
    try {
      const content = readFileSync(file, 'utf-8');
      const data = parse(content);
      const schema = generateSchema(data);
      const json = JSON.stringify(schema, null, 2);
      output(json, opts.output);
      if (!opts.quiet) log(`✓ Schema generated → ${opts.output || 'stdout'}`);
    } catch (err: any) {
      error(`✗ Schema error: ${err.message}`);
      process.exit(1);
    }
  });

// ── init ───────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Create a sample LEAN file')
  .argument('[name]', 'File name', 'sample')
  .action((name) => {
    const filename = name.endsWith('.lean') ? name : `${name}.lean`;
    if (existsSync(filename)) {
      error(`✗ File ${filename} already exists`);
      process.exit(1);
    }

    const sample = `# Sample LEAN file
# Demonstrates the LEAN format features

project:
    name: "My Project"
    version: 1.0
    active: true
    tags:
        - demo
        - example
        - lean

users(id, name, email, age):
    - 1, Alice, "alice@example.com", 30
    - 2, Bob, "bob@example.com", 25
    - 3, Casey, "casey@example.com", 28

blog:
    title: "My Blog"
    author:
        name: Alice
        email: "alice@example.com"
    posts(id, title, content):
        - 1, "First Post", "Hello, world!"
        - 2, "Second Post", "Another post"
    tags:
        - tech
        - programming
`;

    writeFileSync(filename, sample);
    log(`✓ Created ${filename}`);
    log(`\nTry: lean parse ${filename}`);
  });

// ── sql ──────────────────────────────────────────────────────────────────
program
  .command('sql')
  .description('Run SQL queries on .lean files (SQLite-backed)')
  .argument('<query>', 'SQL query (e.g. \'SELECT name FROM users\')')
  .argument('[files...]', 'One or more .lean files')
  .option('--format <fmt>', 'Output format: json (default) or lean', 'json')
  .option('--pretty', 'Pretty-print JSON output')
  .action(async (query, files, opts) => {
    const { sqlCommand } = await import('./sql.js');
    if (!files || files.length === 0) {
      const leanFiles = readdirSync(process.cwd()).filter(f => f.endsWith('.lean'));
      if (leanFiles.length === 0) {
        error('No .lean files found. Specify files: lean sql "SELECT ..." file.lean');
        process.exit(1);
      }
      files = leanFiles;
    }
    await sqlCommand(files, query, { format: opts.format, pretty: opts.pretty });
  });

// ── watch ────────────────────────────────────────────────────────────────
program
  .command('watch')
  .description('Watch .lean files for changes, emit incremental diffs')
  .argument('[files...]', '.lean files to watch')
  .option('--format <fmt>', 'Output format: text (default) or json', 'text')
  .option('--serve <port>', 'Start SSE HTTP server on port for live dashboards', parseInt)
  .option('--debounce <ms>', 'Debounce interval in ms', '200')
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (files, opts) => {
    const { watchCommand } = await import('./watch.js');
    if (!files || files.length === 0) {
      files = readdirSync(process.cwd()).filter((f: string) => f.endsWith('.lean'));
      if (files.length === 0) {
        error('No .lean files found to watch.');
        process.exit(1);
      }
    }
    await watchCommand(files, {
      format: opts.format,
      serve: opts.serve,
      debounce: parseInt(opts.debounce) || 200,
      quiet: opts.quiet,
    });
  });

// ── fuzz ─────────────────────────────────────────────────────────────────
program
  .command('fuzz')
  .description('Property-based fuzz testing — random valid LEAN, parse/format/parse, assert equality')
  .option('-n, --iterations <n>', 'Number of fuzz iterations', '10000')
  .option('--seed <n>', 'Random seed (reproduce failures)', parseInt)
  .option('-q, --quiet', 'JSON output for machine processing')
  .action(async (opts) => {
    const { fuzzCommand } = await import('./fuzz.js');
    await fuzzCommand({
      iterations: parseInt(opts.iterations) || 10000,
      seed: opts.seed,
      quiet: opts.quiet,
    });
  });

// ── migrate ──────────────────────────────────────────────────────────────
const migrate = program.command('migrate').description('Schema evolution tool with up/down LEAN scripts');

migrate
  .command('create <name>')
  .description('Create a new migration file')
  .option('--dir <path>', 'Migrations directory', 'migrations')
  .option('-q, --quiet', 'Suppress output')
  .action(async (name, opts) => {
    const { migrateCreateCommand } = await import('./migrate.js');
    await migrateCreateCommand(name, { dir: opts.dir, quiet: opts.quiet });
  });

migrate
  .command('up')
  .description('Apply all pending migrations')
  .option('--dir <path>', 'Migrations directory', 'migrations')
  .option('-q, --quiet', 'Suppress output')
  .action(async (opts) => {
    const { migrateUpCommand } = await import('./migrate.js');
    await migrateUpCommand({ dir: opts.dir, quiet: opts.quiet });
  });

migrate
  .command('down')
  .description('Roll back the last migration')
  .option('--dir <path>', 'Migrations directory', 'migrations')
  .option('-q, --quiet', 'Suppress output')
  .action(async (opts) => {
    const { migrateDownCommand } = await import('./migrate.js');
    await migrateDownCommand({ dir: opts.dir, quiet: opts.quiet });
  });

migrate
  .command('status')
  .description('Show migration status')
  .option('--dir <path>', 'Migrations directory', 'migrations')
  .option('-q, --quiet', 'Suppress output')
  .action(async (opts) => {
    const { migrateStatusCommand } = await import('./migrate.js');
    await migrateStatusCommand({ dir: opts.dir, quiet: opts.quiet });
  });

// ── repl ─────────────────────────────────────────────────────────────────
program
  .command('repl')
  .description('Interactive REPL for LEAN format exploration')
  .argument('[file]', 'Load a .lean file on startup')
  .option('-q, --quiet', 'Suppress banner')
  .action(async (file, opts) => {
    const { replCommand } = await import('./repl.js');
    await replCommand({ file, quiet: opts.quiet });
  });

// ── publish ──────────────────────────────────────────────────────────────
program
  .command('publish')
  .description('Publish .lean files to a local registry')
  .argument('[files...]', '.lean files to publish')
  .option('--registry <dir>', 'Registry directory', '.lean-registry')
  .option('--force', 'Overwrite existing published files')
  .option('-q, --quiet', 'Suppress output')
  .action(async (files, opts) => {
    const { publishCommand } = await import('./publish.js');
    await publishCommand(files, { registry: opts.registry, quiet: opts.quiet, force: opts.force });
  });

// ── pull ─────────────────────────────────────────────────────────────────
program
  .command('pull')
  .description('Pull .lean files from a registry')
  .argument('<registry>', 'Registry directory or path')
  .option('--force', 'Overwrite existing local files')
  .option('-q, --quiet', 'Suppress output')
  .action(async (registry, opts) => {
    const { pullCommand } = await import('./publish.js');
    await pullCommand(registry, { quiet: opts.quiet, force: opts.force });
  });

// ── help override ──────────────────────────────────────────────────────
program.on('--help', () => {
  log('\nCreative Features (beyond spec):');
  log('  lean diff <a> <b>           Structural diff between two .lean files');
  log('  lean query <file> <path>     JMESPath-style query (e.g. "users[0].name")');
  log('  lean schema <file>           Generate JSON Schema from sample data');
  log('  lean sql <query> [files..]   SQL queries on .lean files');
  log('  lean watch [files..]         Watch for changes, emit patches');
  log('  lean fuzz                    Property-based fuzz testing');
  log('  lean migrate create|up|down  Schema evolution');
  log('  lean repl [file]             Interactive LEAN REPL');
  log('  lean publish [files..]       Publish .lean files to registry');
  log('  lean pull <registry>         Pull .lean files from registry');
  log('\nUnix piping:');
  log('  cat data.lean | lean parse | jq .name');
  log('  curl api.com/data.json | lean format');
});

// ── main ───────────────────────────────────────────────────────────────
async function main() {
  await ensureInit();
  await program.parseAsync(process.argv);
}

// ── helpers ────────────────────────────────────────────────────────────

async function ensureInit() {
  try {
    await initParser();
  } catch {
    // WASM unavailable — JS fallback will be used
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function output(content: string, file?: string) {
  if (file) writeFileSync(file, content + '\n');
  else process.stdout.write(content + '\n');
}

function log(msg: string) { console.log(msg); }
function error(msg: string) { console.error(msg); }

// ── compile serializers ────────────────────────────────────────────────

function toEnv(obj: Record<string, unknown>, prefix = ''): string {
  let result = '';
  for (const [key, value] of Object.entries(obj)) {
    const currentKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result += toEnv(value as Record<string, unknown>, currentKey);
    } else if (Array.isArray(value)) {
      result += `${currentKey}=${value.map(v => String(v).includes(',') ? `"${v}"` : v).join(',')}\n`;
    } else {
      result += `${currentKey}=${value}\n`;
    }
  }
  return result;
}

function toYaml(obj: Record<string, unknown>): string {
  return yaml.dump(obj, { indent: 2, noRefs: true, sortKeys: false });
}

function toToml(obj: Record<string, unknown>): string {
  return toml.stringify(obj as any);
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
