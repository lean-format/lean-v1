import { describe, it, expect } from 'vitest';
import { diff, formatDiff } from './diff.js';

describe('LEAN Diff', () => {
  it('detects no changes', () => {
    const a = { name: 'Alice', age: 30 };
    const result = diff(a, a);
    expect(result).toHaveLength(0);
  });

  it('detects added keys', () => {
    const result = diff({ name: 'Alice' }, { name: 'Alice', age: 30 });
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'added', path: 'age' })
    );
  });

  it('detects removed keys', () => {
    const result = diff({ name: 'Alice', age: 30 }, { name: 'Alice' });
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'removed', path: 'age' })
    );
  });

  it('detects changed values', () => {
    const result = diff({ name: 'Alice' }, { name: 'Bob' });
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'changed', path: 'name', oldValue: 'Alice', newValue: 'Bob' })
    );
  });

  it('detects nested changes', () => {
    const a = { user: { name: 'Alice', age: 30 } };
    const b = { user: { name: 'Alice', age: 31 } };
    const result = diff(a, b);
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'changed', path: 'user.age' })
    );
  });

  it('detects array additions', () => {
    const result = diff({ items: [1, 2] }, { items: [1, 2, 3] });
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'added', path: 'items[2]' })
    );
  });

  it('detects array removals', () => {
    const result = diff({ items: [1, 2, 3] }, { items: [1, 3] });
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'removed', path: 'items[2]' })
    );
  });

  it('returns no changes for both null', () => {
    expect(diff(null, null)).toHaveLength(0);
  });

  it('returns no changes for both undefined', () => {
    expect(diff(undefined, undefined)).toHaveLength(0);
  });

  it('detects change when one is null', () => {
    const result = diff(null, { a: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('changed');
    expect(result[0].path).toBe('(root)');
  });

  it('detects change when other is null', () => {
    const result = diff({ a: 1 }, null);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('changed');
  });

  it('detects change between different types', () => {
    const result = diff('string', 42);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('changed');
    expect(result[0].path).toBe('(root)');
  });

  it('detects root primitive change', () => {
    const result = diff('hello', 'world');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('changed');
    if (result[0].type === 'changed') {
      expect(result[0].oldValue).toBe('hello');
      expect(result[0].newValue).toBe('world');
    }
  });

  it('detects root array diff', () => {
    const result = diff([1, 2], [1, 2, 3]);
    expect(result).toContainEqual(
      expect.objectContaining({ type: 'added', path: '[2]' })
    );
  });

  it('detects array vs object mismatch', () => {
    const result = diff([1, 2], { a: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('changed');
  });

  it('formats diff output', () => {
    const entries = diff({ name: 'Alice' }, { name: 'Bob', age: 30 });
    const formatted = formatDiff(entries);
    expect(formatted).toContain('~');
    expect(formatted).toContain('name');
    expect(formatted).toContain('+');
    expect(formatted).toContain('age');
  });

  it('formatDiff returns no differences for empty', () => {
    expect(formatDiff([])).toBe('No differences found.');
  });

  it('formatDiff handles removed type', () => {
    const result = diff({ a: 1 }, {});
    const formatted = formatDiff(result);
    expect(formatted).toContain('-');
    expect(formatted).toContain('a');
  });
});
