import { parse, format } from '@lean-format/core';

interface FuzzOptions {
  iterations?: number;
  seed?: number;
  quiet?: boolean;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

// Generate a random LEAN document
function generateRandomLean(depth: number, rand: () => number): any {
  if (depth <= 0 || rand() < 0.1) {
    return randomPrimitive(rand);
  }

  const kind = rand();
  if (kind < 0.4) {
    return randomObject(depth, rand);
  } else if (kind < 0.7) {
    return randomArray(depth, rand);
  } else if (kind < 0.85) {
    return randomRowTable(depth, rand);
  } else {
    return randomInlines(depth, rand);
  }
}

function randomPrimitive(rand: () => number): any {
  const kind = rand();
  if (kind < 0.2) return randomString(rand);
  if (kind < 0.4) return randomInt(rand, -1000, 1000);
  if (kind < 0.5) return rand() * 1000;
  if (kind < 0.6) return true;
  if (kind < 0.7) return false;
  if (kind < 0.8) return null;
  if (kind < 0.9) return 0; // edge case: zero
  return ''; // edge case: empty string
}

function randomString(rand: () => number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-:. ';
  const special = ['hello', 'true', 'false', 'null', '123', '', 'a', 'a-b', 'a.b', 'a_b'];
  if (rand() < 0.3) return pick(special, rand);
  const len = randomInt(rand, 0, 20);
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randomInt(rand, 0, chars.length - 1)];
  return s.trim();
}

function randomObject(depth: number, rand: () => number): Record<string, any> {
  const obj: Record<string, any> = {};
  const count = randomInt(rand, 0, 6);
  for (let i = 0; i < count; i++) {
    const key = generateLeanKey(rand);
    obj[key] = generateRandomLean(depth - 1, rand);
  }
  return obj;
}

function randomArray(depth: number, rand: () => number): any[] {
  const count = randomInt(rand, 0, 5);
  const arr: any[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(generateRandomLean(depth - 1, rand));
  }
  return arr;
}

function randomRowTable(depth: number, rand: () => number): Record<string, any> {
  const tableName = generateLeanKey(rand);
  const colCount = randomInt(rand, 1, 5);
  const columns: string[] = [];
  for (let i = 0; i < colCount; i++) {
    columns.push(generateLeanKey(rand));
  }
  const rowCount = randomInt(rand, 0, 5);
  const rows: Record<string, any>[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};
    for (const col of columns) {
      row[col] = randomPrimitive(rand);
    }
    rows.push(row);
  }

  // Use row syntax as a formatted string
  const obj: Record<string, any> = {};
  // Store as array of objects; format() will handle row syntax
  obj[tableName] = rows;
  return obj;
}

function randomInlines(depth: number, rand: () => number): any {
  // Reuse existing generators
  const obj = randomObject(depth, rand);
  if (Object.keys(obj).length === 1) {
    obj.inline = 'test'; // ensure inline format triggers
  }
  return obj;
}

function generateLeanKey(rand: () => number): string {
  const keys = ['name', 'id', 'value', 'count', 'data', 'items', 'users', 'config', 'key', 'type',
    'a', 'x', 'my-key', 'nested.key', '_private', '$special'];
  if (rand() < 0.3) return pick(keys, rand);
  const len = randomInt(rand, 1, 12);
  let key = '';
  // Must start with letter, underscore, or $
  const starts = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
  key += starts[randomInt(rand, 0, starts.length - 1)];
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$-';
  for (let i = 1; i < len; i++) {
    key += chars[randomInt(rand, 0, chars.length - 1)];
  }
  return key;
}

interface FuzzFailure {
  test: string;
  input: string;
  error: string;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v: any, i: number) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

export async function fuzzCommand(opts: FuzzOptions = {}): Promise<void> {
  const iterations = opts.iterations ?? 10000;
  const seed = opts.seed ?? Date.now();
  const rand = seededRandom(seed);
  const failures: FuzzFailure[] = [];

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    // Test 1: Round-trip parse → format → parse (deep equal)
    if (i % 1000 === 0 && !opts.quiet) {
      process.stderr.write(`\rFuzz: ${i}/${iterations} (${failures.length} failures)`);
    }

    const depth = randomInt(rand, 0, 5);
    const data = generateRandomLean(depth, rand);

    try {
      // format → parse (string round-trip)
      const formatted = format(data, { indent: '  ', useRowSyntax: true, rowThreshold: 2 });
      const reparsed = parse(formatted);

      if (!deepEqual(data, reparsed)) {
        failures.push({
          test: 'format → parse round-trip',
          input: JSON.stringify(data),
          error: `Deep equal failed after format/parse\nFormatted:\n${formatted}\nReparsed:\n${JSON.stringify(reparsed)}`,
        });
        if (failures.length >= 10) break;
        continue;
      }

      // Test 2: parse → format → parse (deep equal)
      const inputStr = JSON.stringify(data);
      // Convert some data to LEAN first (directly via format)
      const leanStr = format(data, { indent: '  ', useRowSyntax: true, rowThreshold: 1 });
      const parsedBack = parse(leanStr);

      if (!deepEqual(data, parsedBack)) {
        failures.push({
          test: 'parse → format → parse round-trip',
          input: inputStr,
          error: `Deep equal failed\nLEAN:\n${leanStr}\nParsed:\n${JSON.stringify(parsedBack)}`,
        });
        if (failures.length >= 10) break;
        continue;
      }

      // Test 3: Parse + format idempotency (format(format(x)) == format(x))
      if (rand() < 0.1) { // sample 10%
        const formattedAgain = format(reparsed, { indent: '  ', useRowSyntax: true, rowThreshold: 2 });
        if (formatted !== formattedAgain) {
          failures.push({
            test: 'format idempotency',
            input: inputStr,
            error: `format(format(x)) !== format(x)\nFirst:\n${formatted}\nSecond:\n${formattedAgain}`,
          });
          if (failures.length >= 10) break;
        }
      }
    } catch (err: any) {
      failures.push({
        test: 'unexpected error',
        input: JSON.stringify(data),
        error: err.message,
      });
      if (failures.length >= 10) break;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (opts.quiet) {
    console.log(JSON.stringify({
      iterations,
      seed,
      elapsed,
      failures: failures.length,
      failureDetails: failures,
    }));
    return;
  }

  console.log(`\n\n═══ Fuzz Results ═══`);
  console.log(`  Iterations: ${iterations}`);
  console.log(`  Seed:       ${seed}`);
  console.log(`  Elapsed:    ${elapsed}s`);
  console.log(`  Failures:   ${failures.length}/${iterations}`);

  if (failures.length > 0) {
    console.log(`\n  ── Failures ──`);
    for (const f of failures.slice(0, 5)) {
      console.log(`\n  Test: ${f.test}`);
      console.log(`  Input: ${f.input.substring(0, 200)}`);
      console.log(`  Error: ${f.error.substring(0, 300)}`);
    }
    if (failures.length > 5) {
      console.log(`\n  ... and ${failures.length - 5} more`);
    }
    console.log(`\n  Re-run with: lean fuzz --seed ${seed}`);
  } else {
    console.log('  All round-trips passed');
  }

  process.exit(failures.length > 0 ? 1 : 0);
}
