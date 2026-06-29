import { type ParseOptions } from './types.js';

interface CacheEntry {
  result: unknown;
  hash: string;
  lastAccess: number;
}

const DEFAULT_MAX_SIZE = 64;

function fastHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x6b8b4567;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x1b873593);
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

function optionsKey(options: ParseOptions): string {
  const { strict, maxDepth, maxInputSize, useDotNotation } = options;
  return `${strict ?? ''}|${maxDepth ?? ''}|${maxInputSize ?? ''}|${useDotNotation ?? ''}`;
}

export class ParseCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  public hits: number = 0;
  public misses: number = 0;
  public evictions: number = 0;

  constructor(maxSize: number = DEFAULT_MAX_SIZE) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(input: string, options: ParseOptions): unknown | undefined {
    const key = fastHash(input) + '|' + optionsKey(options);
    const entry = this.cache.get(key);
    if (entry) {
      if (entry.hash !== fastHash(input)) {
        this.cache.delete(key);
        this.misses++;
        return undefined;
      }
      entry.lastAccess = Date.now();
      this.hits++;
      return entry.result;
    }
    this.misses++;
    return undefined;
  }

  set(input: string, options: ParseOptions, result: unknown): void {
    if (this.cache.size >= this.maxSize) {
      let oldestKey = '';
      let oldestTime = Infinity;
      for (const [k, v] of this.cache) {
        if (v.lastAccess < oldestTime) {
          oldestTime = v.lastAccess;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.evictions++;
      }
    }

    const key = fastHash(input) + '|' + optionsKey(options);
    this.cache.set(key, {
      result,
      hash: fastHash(input),
      lastAccess: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get size(): number {
    return this.cache.size;
  }

  stats(): { hits: number; misses: number; evictions: number; size: number; maxSize: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export async function cachedParse(
  input: string,
  options: ParseOptions = {},
  cache?: ParseCache,
): Promise<unknown> {
  if (!cache) cache = defaultCache;
  const cached = cache.get(input, options);
  if (cached !== undefined) return cached;

  const { parse } = await import('./parser.js');
  const result = parse(input, options);
  cache.set(input, options, result);
  return result;
}

export const defaultCache = new ParseCache();
