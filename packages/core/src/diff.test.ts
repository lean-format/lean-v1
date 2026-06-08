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

  it('formats diff output', () => {
    const entries = diff({ name: 'Alice' }, { name: 'Bob', age: 30 });
    const formatted = formatDiff(entries);
    expect(formatted).toContain('~');
    expect(formatted).toContain('name');
    expect(formatted).toContain('+');
    expect(formatted).toContain('age');
  });
});
