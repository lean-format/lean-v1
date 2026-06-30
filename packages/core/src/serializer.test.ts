import { describe, it, expect } from 'vitest';
import { format } from './serializer.js';

describe('Serializer', () => {
  it('serializes a simple object', () => {
    const out = format({ key: 'value' });
    expect(out).toContain('key: value');
  });

  it('serializes nested objects', () => {
    const out = format({ a: { b: 1 } });
    expect(out).toContain('b: 1');
  });

  it('throws for non-object root', () => {
    expect(() => format('string')).toThrow();
    expect(() => format(null)).toThrow();
    expect(() => format([1, 2])).toThrow();
  });

  it('throws for non-finite numbers', () => {
    expect(() => format({ val: NaN })).toThrow();
    expect(() => format({ val: Infinity })).toThrow();
    expect(() => format({ val: -Infinity })).toThrow();
  });

  it('handles empty object value', () => {
    const out = format({ empty: {} });
    expect(out).toContain('empty: {}');
  });

  it('serializes primitive arrays', () => {
    const out = format({ items: [1, 'two', true] });
    expect(out).toContain('- 1');
    expect(out).toContain('- two');
    expect(out).toContain('- true');
  });

  it('uses row syntax for uniform object arrays above threshold', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Casey' },
        { id: 4, name: 'Dave' },
      ],
    };
    const out = format(data, { useRowSyntax: true, rowThreshold: 4 });
    expect(out).toContain('users(id, name):');
    expect(out).toContain('- 1, Alice');
  });

  it('uses standard list for arrays below threshold', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    };
    const out = format(data, { useRowSyntax: true, rowThreshold: 4 });
    expect(out).not.toContain('id, name');
  });

  it('uses row syntax disabled globally', () => {
    const data = {
      items: [
        { a: 1 },
        { a: 2 },
        { a: 3 },
        { a: 4 },
      ],
    };
    const out = format(data, { useRowSyntax: false });
    expect(out).not.toContain('a):');
  });

  it('handles arrays of non-uniform objects', () => {
    const data = { items: [{ a: 1 }, { b: 2 }] };
    const out = format(data);
    expect(out).toContain('a: 1');
    expect(out).toContain('b: 2');
  });

  it('quotes strings that need it', () => {
    const out = format({ val: 'has space' });
    expect(out).toContain('"has space"');
  });

  it('does not quote simple strings', () => {
    const out = format({ val: 'plain' });
    expect(out).not.toContain('"plain"');
  });

  it('escapes special characters in strings', () => {
    const out = format({ val: 'line\nbreak' });
    expect(out).toContain('\\n');
  });

  it('sorts keys when option is set', () => {
    const out = format({ z: 1, a: 2, m: 3 }, { sortKeys: true });
    const aIdx = out.indexOf('a: 2');
    const mIdx = out.indexOf('m: 3');
    const zIdx = out.indexOf('z: 1');
    expect(aIdx).toBeLessThan(mIdx);
    expect(mIdx).toBeLessThan(zIdx);
  });

  it('uses dot notation when enabled', () => {
    const data = { a: { b: 1, c: 2 } };
    const out = format(data, { useDotNotation: true });
    expect(out).toContain('a.b: 1');
    expect(out).toContain('a.c: 2');
  });

  it('handles null and boolean values', () => {
    const out = format({ a: null, b: true, c: false });
    expect(out).toContain('a: null');
    expect(out).toContain('b: true');
    expect(out).toContain('c: false');
  });

  it('serializes undefined values as null', () => {
    const out = format({ a: undefined });
    expect(out).toContain('a: null');
  });

  it('serializes symbol values as null', () => {
    const out = format({ a: Symbol('test') as any });
    expect(out).toContain('a: null');
  });

  it('sorts keys with dot notation', () => {
    const out = format({ z: { a: 1 }, a: { b: 2 } }, { useDotNotation: true, sortKeys: true });
    const aIdx = out.indexOf('a.b:');
    const zIdx = out.indexOf('z.a:');
    expect(aIdx).toBeLessThan(zIdx);
  });

  it('formats array values with dot notation (no space after colon)', () => {
    const out = format({ a: { list: [1, 2] } }, { useDotNotation: true });
    expect(out).toContain('a.list:\n');
  });

  it('formats nested arrays with mixed object/primitive', () => {
    const out = format({ nested: [[{ a: 1 }]] });
    expect(out).toContain('a: 1');
  });

  it('uses row syntax in deeply nested arrays', () => {
    const data = { nested: [[{ a: 1, b: 2 }]] };
    const out = format(data, { useRowSyntax: true, rowThreshold: 1 });
    expect(out).toContain('1, 2');
  });
});
