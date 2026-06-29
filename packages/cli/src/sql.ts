import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { parse, format } from '@lean-format/core';

interface SqlOptions {
  format?: string;
  pretty?: boolean;
}

function flattenToTables(data: unknown, prefix = ''): Map<string, Map<string, string>[]> {
  const tables = new Map<string, Map<string, string>[]>();

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      const tableKey = prefix ? `${prefix}_${key}` : key;

      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        // Array of objects — treat as table
        const rows = value.map((item: any) => {
          const row = new Map<string, string>();
          for (const [k, v] of Object.entries(item)) {
            row.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
          }
          return row;
        });
        tables.set(tableKey, rows);

        // Also recurse for nested tables
        for (const item of value) {
          const nested = flattenToTables(item, tableKey);
          for (const [nk, nr] of nested) {
            if (!tables.has(nk)) tables.set(nk, nr);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const nested = flattenToTables(value, tableKey);
        for (const [nk, nr] of nested) {
          tables.set(nk, nr);
        }
      } else if (Array.isArray(value)) {
        // Simple array — single column table
        const rows = value.map((v: any) => {
          const row = new Map<string, string>();
          row.set('value', String(v));
          return row;
        });
        tables.set(tableKey, rows);
      }
    }
  }

  return tables;
}

export async function sqlCommand(files: string[], query: string, opts: SqlOptions = {}): Promise<void> {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');

  try {
    // Parse all files and build tables
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const data = parse(content);
      const tables = flattenToTables(data);

      for (const [tableName, rows] of tables) {
        if (rows.length === 0) continue;

        const sanitizedName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
        const allColumns = new Set<string>();
        for (const row of rows) {
          for (const [col] of row) {
            allColumns.add(col);
          }
        }

        const columns = Array.from(allColumns);
        const colDefs = columns.map(c => `"${c}" TEXT`).join(', ');
        db.exec(`CREATE TABLE IF NOT EXISTS "${sanitizedName}" (${colDefs})`);

        const insert = db.prepare(`INSERT INTO "${sanitizedName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`);

        for (const row of rows) {
          const vals = columns.map(c => row.get(c) || null);
          insert.run(...vals);
        }
      }
    }

    // Run the query
    let results: any[];
    try {
      results = db.prepare(query).all();
    } catch (err: any) {
      console.error(`SQL error: ${err.message}`);
      // Show available tables
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      if (tables.length > 0) {
        console.error(`Available tables: ${tables.map(t => t.name).join(', ')}`);
        for (const t of tables) {
          const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all() as { name: string }[];
          console.error(`  ${t.name}: ${cols.map(c => c.name).join(', ')}`);
        }
      }
      process.exit(1);
    }

    // Output results
    if (opts.format === 'lean') {
      const formatted = format({ data: results }, { indent: '  ', useRowSyntax: true, rowThreshold: 1 });
      console.log(formatted);
    } else {
      const json = opts.pretty
        ? JSON.stringify(results, null, 2)
        : JSON.stringify(results);
      console.log(json);
    }
  } finally {
    db.close();
  }
}
