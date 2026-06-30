import { describe, it, expect } from 'vitest';
import { query } from './query.js';

describe('LEAN Query', () => {
  const data = {
    users: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Casey', age: 28 },
    ],
    store: {
      name: 'TechShop',
      products: [
        { id: 1, name: 'Widget', price: 19.99 },
        { id: 2, name: 'Gadget', price: 29.99 },
      ],
    },
    tags: ['tech', 'programming', 'lean'],
  };

  it('queries a top-level key', () => {
    const result = query(data, 'store');
    expect(result.exists).toBe(true);
    expect((result.value as any).name).toBe('TechShop');
  });

  it('queries a nested key with dot path', () => {
    const result = query(data, 'store.name');
    expect(result.exists).toBe(true);
    expect(result.value).toBe('TechShop');
  });

  it('queries an array index', () => {
    const result = query(data, 'users[0]');
    expect(result.exists).toBe(true);
    expect((result.value as any).name).toBe('Alice');
  });

  it('queries into an array element', () => {
    const result = query(data, 'users[1].name');
    expect(result.exists).toBe(true);
    expect(result.value).toBe('Bob');
  });

  it('queries with wildcard', () => {
    const result = query(data, 'users[*].name');
    expect(result.exists).toBe(true);
    expect(result.value).toEqual(['Alice', 'Bob', 'Casey']);
  });

  it('returns not found for non-existent path', () => {
    const result = query(data, 'users[99].name');
    expect(result.exists).toBe(false);
  });

  it('returns not found for non-existent key', () => {
    const result = query(data, 'store.nonExistent');
    expect(result.exists).toBe(false);
  });

  it('queries primitive list items', () => {
    const result = query(data, 'tags[0]');
    expect(result.exists).toBe(true);
    expect(result.value).toBe('tech');
  });

  it('returns root for empty path', () => {
    const result = query(data, '');
    expect(result.exists).toBe(true);
    expect(result.value).toBe(data);
  });

  it('returns root for whitespace-only path', () => {
    const result = query(data, '  ');
    expect(result.exists).toBe(true);
    expect(result.value).toBe(data);
  });

  it('returns not found when navigating through null', () => {
    const result = query({ a: null }, 'a.b');
    expect(result.exists).toBe(false);
  });

  it('returns not found when navigating through primitive', () => {
    const result = query({ a: 'str' }, 'a.b');
    expect(result.exists).toBe(false);
  });

  it('returns not found when key access on array', () => {
    const result = query([1, 2, 3], 'someKey');
    expect(result.exists).toBe(false);
  });

  it('handles wildcard with no matches', () => {
    const result = query([{ a: 1 }], '[*].nonexistent');
    expect(result.exists).toBe(false);
    expect(result.value).toEqual([]);
  });

  it('handles wildcard on non-array', () => {
    const result = query({ a: 1 }, '[*]');
    expect(result.exists).toBe(false);
  });

  it('handles index access on non-array', () => {
    const result = query({ a: 1 }, '[0]');
    expect(result.exists).toBe(false);
  });

  it('treats unmatched bracket content as key', () => {
    const result = query(data, 'users[abc]');
    expect(result.exists).toBe(false);
  });

  it('returns full array for wildcard at end of path', () => {
    const result = query(data, 'users[*]');
    expect(result.exists).toBe(true);
    expect(Array.isArray(result.value)).toBe(true);
    expect((result.value as any[]).length).toBe(3);
  });
});
