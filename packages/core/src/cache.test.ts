import { describe, it, expect } from 'vitest';
import { ParseCache, cachedParse } from './cache.js';

describe('ParseCache', () => {
  it('returns undefined for cache miss', () => {
    const cache = new ParseCache(10);
    expect(cache.get('key: 1', {})).toBeUndefined();
  });

  it('returns cached result on hit', () => {
    const cache = new ParseCache(10);
    const input = 'key: 1';
    const result = { key: 1 };
    cache.set(input, {}, result);
    expect(cache.get(input, {})).toEqual(result);
  });

  it('respects max size and evicts LRU', () => {
    const cache = new ParseCache(2);
    cache.set('a: 1', {}, { a: 1 });
    cache.set('b: 2', {}, { b: 2 });
    expect(cache.size).toBe(2);

    cache.set('c: 3', {}, { c: 3 });
    expect(cache.size).toBe(2);
    expect(cache.evictions).toBe(1);
  });

  it('differentiates by options', async () => {
    const cache = new ParseCache(10);
    const input = 'key: 1';
    cache.set(input, { strict: true }, { key: 'strict' });
    cache.set(input, { strict: false }, { key: 'loose' });
    expect(cache.size).toBe(2);
    await expect(cachedParse(input, { strict: true }, cache)).resolves.toEqual({ key: 'strict' });
  });

  it('set without eviction keeps evictions at 0', () => {
    const cache = new ParseCache(10);
    cache.set('a: 1', {}, { a: 1 });
    expect(cache.evictions).toBe(0);
    expect(cache.size).toBe(1);
  });

  it('clear resets everything', () => {
    const cache = new ParseCache(10);
    cache.set('key: 1', {}, { key: 1 });
    cache.get('key: 1', {});
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.stats().hits).toBe(0);
    expect(cache.stats().misses).toBe(0);
    expect(cache.stats().evictions).toBe(0);
  });

  it('tracks stats correctly', () => {
    const cache = new ParseCache(10);
    cache.set('a: 1', {}, { a: 1 });
    cache.get('a: 1', {});
    cache.get('b: 2', {});

    const stats = cache.stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });

  it('cachedParse works with default cache', async () => {
    const result = await cachedParse('key: val');
    expect(result).toHaveProperty('key', 'val');
  });

  it('cachedParse returns cached result on repeated call', async () => {
    const cache = new ParseCache(10);
    const r1 = await cachedParse('a: 1', {}, cache);
    const r2 = await cachedParse('a: 1', {}, cache);
    expect(r1).toEqual(r2);
  });
});
