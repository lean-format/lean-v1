import { createInterface } from 'node:readline';
import { parse, format, validate, diff, query } from '@lean-format/core';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HISTORY_FILE = '.lean_repl_history';

interface ReplOptions {
  file?: string;
  quiet?: boolean;
}

export async function replCommand(opts: ReplOptions = {}): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'lean> ',
  });

  let data: Record<string, unknown> = {};

  if (opts.file) {
    if (!existsSync(opts.file)) {
      console.error(`File not found: ${opts.file}`);
      process.exit(1);
    }
    const content = readFileSync(opts.file, 'utf-8');
    data = parse(content) as Record<string, unknown>;
    if (!opts.quiet) console.log(`Loaded: ${opts.file}`);
  }

  try {
    const history = readFileSync(HISTORY_FILE, 'utf-8').split('\n').filter(Boolean);
    rl.on('history', () => history);
  } catch { /* no history */ }

  if (!opts.quiet) {
    console.log('LEAN REPL — Type .help for commands, Ctrl+C or .exit to quit');
  }

  rl.prompt();

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('.')) {
      await handleDotCommand(trimmed, rl, opts, () => data);
      rl.prompt();
      return;
    }

    try {
      data = parse(trimmed) as Record<string, unknown>;
      const formatted = format(data, { indent: '  ', useRowSyntax: true, rowThreshold: 2 });
      console.log(formatted);
    } catch {
      try {
        const input = JSON.parse(trimmed);
        const formatted = format(input, { indent: '  ', useRowSyntax: true, rowThreshold: 2 });
        console.log(formatted);
      } catch {
        console.error('Parse error: invalid LEAN or JSON input');
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log();
  });

  process.stdin.on('keypress', () => {
    // Keep process alive
  });
}

async function handleDotCommand(
  cmd: string,
  rl: ReturnType<typeof createInterface>,
  opts: ReplOptions,
  getData: () => Record<string, unknown>,
): Promise<void> {
  const parts = cmd.split(/\s+/);
  const command = parts[0].toLowerCase();

  switch (command) {
    case '.help':
      console.log(`
  .help                Show this help
  .exit, .quit         Exit the REPL
  .load <file>         Load a .lean file into context
  .save <file>         Save current context to .lean file
  .dump                Show current context as JSON
  .validate            Validate current context
  .query <path>        Query a dot-separated path
  .diff <file>         Diff current context against a .lean file
  .stats               Show data statistics
  .clear               Clear current context`);
      break;

    case '.exit':
    case '.quit':
      rl.close();
      break;

    case '.load':
      if (parts[1]) {
        try {
          const content = readFileSync(parts[1], 'utf-8');
          const loaded = parse(content);
          Object.assign(getData(), loaded);
          console.log(`Loaded: ${parts[1]}`);
        } catch (err: any) {
          console.error(`Error loading file: ${err.message}`);
        }
      } else {
        console.error('Usage: .load <file>');
      }
      break;

    case '.save':
      if (parts[1]) {
        try {
          const formatted = format(getData(), { indent: '  ', useRowSyntax: true, rowThreshold: 2 });
          writeFileSync(parts[1], formatted);
          console.log(`Saved: ${parts[1]}`);
        } catch (err: any) {
          console.error(`Error saving file: ${err.message}`);
        }
      } else {
        console.error('Usage: .save <file>');
      }
      break;

    case '.dump':
      console.log(JSON.stringify(getData(), null, 2));
      break;

    case '.validate':
      try {
        const content = format(getData(), { indent: '  ' });
        const result = validate(content);
        if (result.valid) {
          console.log('✓ Context is valid');
        } else {
          for (const err of result.errors) {
            console.error(`  ✗ ${err.message}`);
          }
        }
      } catch (err: any) {
        console.error(`Validation error: ${err.message}`);
      }
      break;

    case '.query':
      if (parts[1]) {
        try {
          const result = query(getData(), parts[1]);
          if (result.exists) {
            console.log(JSON.stringify(result.value, null, 2));
          } else {
            console.log(`Path not found: ${parts[1]}`);
          }
        } catch (err: any) {
          console.error(`Query error: ${err.message}`);
        }
      } else {
        console.error('Usage: .query <path>');
      }
      break;

    case '.diff':
      if (parts[1]) {
        try {
          const content = readFileSync(parts[1], 'utf-8');
          const other = parse(content);
          const entries = diff(getData(), other);
          if (entries.length === 0) {
            console.log('No differences');
          } else {
            for (const entry of entries) {
              console.log(`  [${entry.type}] ${entry.path}`);
            }
          }
        } catch (err: any) {
          console.error(`Diff error: ${err.message}`);
        }
      } else {
        console.error('Usage: .diff <file>');
      }
      break;

    case '.stats':
      {
        const obj = getData();
        const stats = {
          keys: Object.keys(obj).length,
          types: {} as Record<string, number>,
        };
        for (const [, value] of Object.entries(obj)) {
          const t = Array.isArray(value) ? 'array' : typeof value;
          stats.types[t] = (stats.types[t] || 0) + 1;
        }
        console.log(`Keys: ${stats.keys}`);
        for (const [t, count] of Object.entries(stats.types)) {
          console.log(`  ${t}: ${count}`);
        }
      }
      break;

    case '.clear':
      Object.keys(getData()).forEach(k => delete getData()[k]);
      console.log('Context cleared');
      break;

    default:
      console.error(`Unknown command: ${command}. Type .help for commands.`);
  }
}
