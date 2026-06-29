import { parse, initParser, isWasmAvailable, getWasmError } from './index.js';
import { JsLeanParser } from './js-parser.js';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function measureTimed(fn: () => void, iterations: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  return samples;
}

function scaleToSize(targetBytes: number): string {
  const row = (i: number) => `  - ${i}, "User ${i}", "user${i}@example.com", ${i % 3 === 0 ? 'admin' : 'user'}, ${i % 7 !== 0}`;
  const header = 'users(id, name, email, role, active):\n';
  const base = [header];
  let size = Buffer.byteLength(header, 'utf-8');
  let idx = 1;
  while (size < targetBytes) {
    const r = row(idx++) + '\n';
    base.push(r);
    size += Buffer.byteLength(r, 'utf-8');
  }
  return 'name: "Benchmark"\nversion: 1\n' + base.join('');
}

async function main() {
  console.log('\n═══ LEAN Parser Size-Sweep: JS vs WASM ═══\n');

  await initParser().catch(() => {});
  const wasmAvailable = isWasmAvailable();
  const wasmError = getWasmError();
  if (wasmError) console.log(`WASM error: ${wasmError.message}`);
  console.log(`WASM parser available: ${wasmAvailable}\n`);

  const targets = [
    { label: '10KB', bytes: 10_000, iters: 10_000 },
    { label: '100KB', bytes: 100_000, iters: 2_000 },
    { label: '1MB', bytes: 1_000_000, iters: 200 },
    { label: '5MB', bytes: 5_000_000, iters: 50 },
    { label: '10MB', bytes: 10_000_000, iters: 20 },
  ];

  const jsParser = new JsLeanParser();
  function parseJS(input: string): unknown { return jsParser.parse(input); }

  // Warm-up: parse a small doc to prime JIT
  const warmDoc = scaleToSize(500);
  for (let i = 0; i < 100; i++) {
    parseJS(warmDoc);
    if (wasmAvailable) parse(warmDoc);
  }

  // Headline: warm parse time for a typical config (5KB)
  const smallDoc = scaleToSize(5_000);
  const warmSamples = measureTimed(() => { parseJS(smallDoc); }, 1000);
  const warmMedian = median(warmSamples);
  const throughput = Math.round(1000 / warmMedian);
  console.log(`Headline — Warm parse (5KB): ${(warmMedian * 1000).toFixed(1)} µs (${throughput.toLocaleString()} parses/sec)\n`);

  const rows: { label: string; jsMs: number; wasmMs: number; crossover: boolean }[] = [];
  let crossoverSeen = false;
  let crossoverSize = '';

  for (const t of targets) {
    const doc = scaleToSize(t.bytes);
    const actualKB = Math.round(Buffer.byteLength(doc, 'utf-8') / 1000);
    process.stderr.write(`  ${t.label} (${actualKB}KB actual)... `);

    const jsSamples = measureTimed(() => { parseJS(doc); }, t.iters);
    const jsTime = median(jsSamples);
    let wasmTime: number;

    if (wasmAvailable) {
      const wasmSamples = measureTimed(() => { parse(doc); }, t.iters);
      wasmTime = median(wasmSamples);
    } else {
      wasmTime = -1;
    }

    const jsMs = Math.round(jsTime * 100) / 100;
    const wasmMs = wasmTime >= 0 ? Math.round(wasmTime * 100) / 100 : -1;

    if (wasmTime >= 0 && jsTime > 0) {
      if (!crossoverSeen && wasmTime < jsTime) {
        crossoverSeen = true;
        crossoverSize = t.label;
      }
    }

    rows.push({ label: t.label, jsMs, wasmMs, crossover: crossoverSeen && wasmTime >= 0 && wasmTime < jsTime });
    process.stderr.write(`JS ${jsMs}ms  WASM ${wasmMs >= 0 ? wasmMs + 'ms' : 'N/A'}\n`);
  }

  console.log(`\n${'Size'.padEnd(10)} ${'JS (ms)'.padEnd(14)} ${'WASM (ms)'.padEnd(14)} ${'Ratio'.padEnd(12)}`);
  console.log('─'.repeat(50));

  for (const r of rows) {
    const label = r.label.padEnd(10);
    const jsStr = String(r.jsMs).padEnd(14);
    const wasmStr = r.wasmMs >= 0 ? String(r.wasmMs).padEnd(14) : 'N/A'.padEnd(14);
    const ratio = r.wasmMs > 0 && r.jsMs > 0 ? (r.jsMs / r.wasmMs).toFixed(2) + 'x' : '';
    const flag = r.crossover ? '  ← WASM wins' : '';
    console.log(`${label} ${jsStr} ${wasmStr} ${ratio.padEnd(12)}${flag}`);
  }

  // Throughput summary
  const lastJSRow = rows[rows.length - 1];
  if (lastJSRow && lastJSRow.jsMs > 0) {
    const throughput = (10_000_000 / lastJSRow.jsMs / 1000).toFixed(0);
    console.log(`\nThroughput: ${throughput} MB/s (10MB / ${lastJSRow.jsMs}ms)`);
  }

  if (crossoverSeen) {
    console.log(`\nCrossover point: ${crossoverSize} — WASM becomes faster than JS at this size.`);
  } else if (wasmAvailable) {
    console.log(`\nNo crossover up to 10MB — JS remains faster at all tested sizes.`);
  } else {
    console.log(`\nWASM not available — JS-only results shown.`);
  }
}

main().catch(console.error);
