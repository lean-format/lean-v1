import { readFileSync, existsSync, watchFile } from 'node:fs';
import { parse, diff, formatDiff } from '@lean-format/core';
import { createServer } from 'node:http';

interface WatchOptions {
  format?: 'json' | 'text';
  serve?: number;
  debounce?: number;
  quiet?: boolean;
}

export async function watchCommand(files: string[], opts: WatchOptions = {}): Promise<void> {
  if (files.length === 0) {
    console.error('Specify at least one .lean file to watch');
    process.exit(1);
  }

  const prevContent = new Map<string, string>();
  let prevData: any = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const debounceMs = opts.debounce ?? 200;

  // SSE clients if --serve is used
  const clients: Set<(event: string) => void> = new Set();

  if (opts.serve) {
    const port = opts.serve;
    const server = createServer((req, res) => {
      if (req.url === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        const send = (data: string) => {
          res.write(`data: ${data}\n\n`);
        };
        clients.add(send);

        req.on('close', () => {
          clients.delete(send);
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      if (!opts.quiet) console.error(`Watch SSE server on http://localhost:${port}/events`);
    });
  }

  function broadcast(data: any): void {
    const msg = JSON.stringify(data);
    for (const send of clients) {
      try { send(msg); } catch { /* client disconnected */ }
    }
  }

  function processChanges(): void {
    debounceTimer = null;
    let anyChange = false;

    for (const file of files) {
      if (!existsSync(file)) continue;
      const content = readFileSync(file, 'utf-8');

      if (prevContent.get(file) === content) continue;
      prevContent.set(file, content);
      anyChange = true;
    }

    if (!anyChange) return;

    // Re-parse all files as a single merged document
    let merged: Record<string, unknown> = {};
    for (const file of files) {
      if (!existsSync(file)) continue;
      try {
        const content = readFileSync(file, 'utf-8');
        const data = parse(content) as Record<string, unknown>;
        merged = { ...merged, ...data };
      } catch (err: any) {
        if (!opts.quiet) console.error(`Parse error in ${file}: ${err.message}`);
        return;
      }
    }

    // Compute diff vs previous
    let patch: any = null;
    if (prevData !== null) {
      try {
        const entries = diff(prevData, merged);
        if (entries.length > 0) {
          patch = {
            type: 'patch',
            timestamp: new Date().toISOString(),
            changes: entries.map(e => ({
              type: e.type,
              path: e.path,
              oldValue: 'oldValue' in e ? e.oldValue : undefined,
              newValue: 'newValue' in e ? e.newValue : undefined,
            })),
          };
        }
      } catch { /* first diff may fail */ }
    }

    const event = {
      type: 'snapshot',
      timestamp: new Date().toISOString(),
      data: merged,
      patch,
    };

    if (opts.format === 'json' || opts.serve) {
      if (opts.format === 'json') {
        console.log(JSON.stringify(event));
      }
      if (opts.serve) {
        broadcast(event);
      }
    } else {
      if (patch) {
        console.log(formatDiff(patch.changes));
      } else {
        console.log(`[${event.timestamp}] No changes`);
      }
    }

    prevData = merged;
  }

  // Initial parse
  processChanges();

  // Watch all files
  for (const file of files) {
    if (!existsSync(file)) {
      console.error(`File not found: ${file}`);
      continue;
    }

    watchFile(file, (curr, prev) => {
      if (curr.mtimeMs === prev.mtimeMs) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processChanges, debounceMs);
    });

    if (!opts.quiet) console.error(`Watching: ${file}`);
  }

  if (!opts.quiet) console.error('Press Ctrl+C to stop');

  // Keep process alive
  await new Promise(() => {});
}
