#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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
  .option('-q, --quiet', 'Suppress info messages')
  .action(async (file, opts) => {
    const content = file ? readFileSync(file, 'utf-8') : await readStdin();
    const baseName = file ? file.replace(/\.lean$/, '') : 'config';
    try {
      const data = parse(content, { strict: opts.strict });
      const formats = opts.format.split(',').map((f: string) => f.trim().toLowerCase());

      const outputs: string[] = [];

      const obj = data as Record<string, unknown>;
      if (formats.includes('json')) {
        writeFileSync(`${baseName}.json`, JSON.stringify(obj, null, 2));
        outputs.push(`${baseName}.json`);
      }
      if (formats.includes('yaml')) {
        writeFileSync(`${baseName}.yaml`, toYaml(obj));
        outputs.push(`${baseName}.yaml`);
      }
      if (formats.includes('toml')) {
        writeFileSync(`${baseName}.toml`, toToml(obj));
        outputs.push(`${baseName}.toml`);
      }
      if (formats.includes('env')) {
        writeFileSync(`${baseName}.env`, toEnv(obj));
        outputs.push(`${baseName}.env`);
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
  .action(async (file1, file2, opts) => {
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

// ── help override ──────────────────────────────────────────────────────
program.on('--help', () => {
  log('\nCreative Features (beyond spec):');
  log('  lean diff <a> <b>        Structural diff between two .lean files');
  log('  lean query <file> <path>  JMESPath-style query (e.g. "users[0].name")');
  log('  lean schema <file>        Generate JSON Schema from sample data');
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
