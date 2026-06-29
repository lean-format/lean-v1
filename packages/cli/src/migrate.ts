import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse, format } from '@lean-format/core';

interface MigrateOptions {
  quiet?: boolean;
  dir?: string;
}

const MIGRATIONS_DIR = 'migrations';
const MIGRATION_TEMPLATE = `# Migration: {{name}}
# Created: {{date}}

up:
    example:
        new_field: "default_value"

down: {}
`;

function getMigrationsDir(dir?: string): string {
  return dir ? resolve(dir, MIGRATIONS_DIR) : resolve(process.cwd(), MIGRATIONS_DIR);
}

function getMigrationName(name: string): string {
  const timestamp = new Date().toISOString().replace(/[T:]/g, '-').replace(/\..+/, '');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `${timestamp}_${slug}.lean`;
}

interface Migration {
  file: string;
  name: string;
  timestamp: string;
  up: Record<string, unknown>;
  down: Record<string, unknown>;
}

function loadMigrations(dir: string): Migration[] {
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter(f => f.endsWith('.lean'))
    .sort();

  return files.map(file => {
    const content = readFileSync(join(dir, file), 'utf-8');
    const data = parse(content) as Record<string, any>;
    return {
      file,
      name: file.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}_/, '').replace(/\.lean$/, ''),
      timestamp: file.substring(0, 19),
      up: (data?.up || {}) as Record<string, unknown>,
      down: (data?.down || {}) as Record<string, unknown>,
    };
  });
}

function getAppliedMigrations(dir: string): string[] {
  const stateFile = join(dir, '.migrated');
  try {
    return JSON.parse(readFileSync(stateFile, 'utf-8'));
  } catch {
    return [];
  }
}

function saveAppliedMigrations(dir: string, applied: string[]): void {
  writeFileSync(join(dir, '.migrated'), JSON.stringify(applied, null, 2));
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value === null) {
      delete result[key];
    } else if (typeof value === 'object' && !Array.isArray(value) && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function migrateCreateCommand(name: string, opts: MigrateOptions = {}): Promise<void> {
  const dir = getMigrationsDir(opts.dir);
  mkdirSync(dir, { recursive: true });

  const filename = getMigrationName(name);
  const filepath = join(dir, filename);
  const content = MIGRATION_TEMPLATE
    .replace(/{{name}}/g, name)
    .replace(/{{date}}/g, new Date().toISOString());

  writeFileSync(filepath, content);

  if (!opts.quiet) {
    console.log(`Created migration: ${filepath}`);
    console.log(`\nEdit the file to define up/down transforms.`);
    console.log(`Then run: lean migrate up`);
  }
}

export async function migrateUpCommand(opts: MigrateOptions = {}): Promise<void> {
  const dir = getMigrationsDir(opts.dir);
  if (!existsSync(dir)) {
    console.error('No migrations directory found. Create one with: lean migrate create <name>');
    process.exit(1);
  }

  const allMigrations = loadMigrations(dir);
  const applied = getAppliedMigrations(dir);
  const pending = allMigrations.filter(m => !applied.includes(m.file));

  if (pending.length === 0) {
    if (!opts.quiet) console.log('All migrations already applied.');
    return;
  }

  // Load current data file (config.lean or data.lean in cwd)
  const dataFile = findDataFile();
  let data: Record<string, unknown> = dataFile
    ? (parse(readFileSync(dataFile, 'utf-8')) as Record<string, unknown>)
    : {};

  for (const migration of pending) {
    data = deepMerge(data, migration.up);

    // Create a .lean backup
    if (dataFile) {
      const existingContent = readFileSync(dataFile, 'utf-8');
      writeFileSync(`${dataFile}.bak`, existingContent);
    }

    if (!opts.quiet) console.log(`Applied: ${migration.name}`);
    applied.push(migration.file);
  }

  saveAppliedMigrations(dir, applied);

  // Write merged data
  if (dataFile) {
    writeFileSync(dataFile, format(data, { indent: '  ', useRowSyntax: true, rowThreshold: 2 }));
  }

  if (!opts.quiet) console.log(`\n${pending.length} migration(s) applied.`);
}

export async function migrateDownCommand(opts: MigrateOptions = {}): Promise<void> {
  const dir = getMigrationsDir(opts.dir);
  if (!existsSync(dir)) {
    console.error('No migrations directory found.');
    process.exit(1);
  }

  const allMigrations = loadMigrations(dir);
  const applied = getAppliedMigrations(dir);

  if (applied.length === 0) {
    if (!opts.quiet) console.log('No migrations to roll back.');
    return;
  }

  const lastApplied = allMigrations.find(m => m.file === applied[applied.length - 1]);
  if (!lastApplied) {
    console.error('Last migration not found in files.');
    process.exit(1);
  }

  const dataFile = findDataFile();
  let data: Record<string, unknown> = dataFile
    ? (parse(readFileSync(dataFile, 'utf-8')) as Record<string, unknown>)
    : {};

  data = deepMerge(data, lastApplied.down);

  if (dataFile) {
    writeFileSync(dataFile, format(data, { indent: '  ', useRowSyntax: true, rowThreshold: 2 }));
  }

  applied.pop();
  saveAppliedMigrations(dir, applied);

  if (!opts.quiet) console.log(`Rolled back: ${lastApplied.name}`);
}

export async function migrateStatusCommand(opts: MigrateOptions = {}): Promise<void> {
  const dir = getMigrationsDir(opts.dir);

  if (!existsSync(dir)) {
    console.log('No migrations found.');
    return;
  }

  const allMigrations = loadMigrations(dir);
  const applied = getAppliedMigrations(dir);

  if (!opts.quiet) {
    console.log('\nMigrations:\n');
    for (const m of allMigrations) {
      const status = applied.includes(m.file) ? '✓' : ' ';
      console.log(`  [${status}] ${m.name}`);
    }
    console.log(`\n  ${applied.length}/${allMigrations.length} applied`);
  }
}

function findDataFile(): string | null {
  const candidates = ['config.lean', 'data.lean', 'sample.lean'];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  const files = readdirSync(process.cwd()).filter(f => f.endsWith('.lean') && !f.includes('migration'));
  return files.length > 0 ? files[0] : null;
}
