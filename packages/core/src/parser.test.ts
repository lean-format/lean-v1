import { describe, it, expect } from 'vitest';
import { parse, parseSync, validate, format } from './index.js';

// ============================================================================
// PARSER TESTS
// ============================================================================

describe('LEAN Parser', () => {
  // ── Basic Values ──────────────────────────────────────────────────
  it('parses unquoted string', () => {
    expect(parse('name: Alice')).toEqual({ name: 'Alice' });
  });

  it('parses quoted string', () => {
    expect(parse('message: "Hello, world!"')).toEqual({ message: 'Hello, world!' });
  });

  it('parses integer', () => {
    expect(parse('age: 30')).toEqual({ age: 30 });
  });

  it('parses negative integer', () => {
    expect(parse('temp: -5')).toEqual({ temp: -5 });
  });

  it('parses float', () => {
    expect(parse('price: 19.99')).toEqual({ price: 19.99 });
  });

  it('parses boolean true/false', () => {
    expect(parse('active: true\ndeleted: false')).toEqual({ active: true, deleted: false });
  });

  it('parses null', () => {
    expect(parse('value: null')).toEqual({ value: null });
  });

  // ── Comments ──────────────────────────────────────────────────────
  it('parses inline comment', () => {
    expect(parse('name: Alice # this is a comment')).toEqual({ name: 'Alice' });
  });

  it('parses full-line comments', () => {
    const result = parse('# header\nname: Alice\n# middle\nage: 30\n# footer');
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  // ── Objects ───────────────────────────────────────────────────────
  it('parses nested objects', () => {
    const result = parse('user:\n    name: Alice\n    age: 30');
    expect(result).toEqual({ user: { name: 'Alice', age: 30 } });
  });

  it('parses deeply nested objects', () => {
    const input = 'a:\n  b:\n    c:\n      d: deep';
    expect(parse(input)).toEqual({ a: { b: { c: { d: 'deep' } } } });
  });

  it('parses multiple top-level keys', () => {
    expect(parse('a: 1\nb: 2\nc: 3')).toEqual({ a: 1, b: 2, c: 3 });
  });

  // ── Lists ─────────────────────────────────────────────────────────
  it('parses simple list', () => {
    const result = parse('tags:\n    - news\n    - tech');
    expect(result).toEqual({ tags: ['news', 'tech'] });
  });

  it('parses list of numbers', () => {
    const result = parse('scores:\n    - 95\n    - 87\n    - 92');
    expect(result).toEqual({ scores: [95, 87, 92] });
  });

  it('parses mixed list', () => {
    expect(parse('items:\n    - Alice\n    - 42\n    - true\n    - null')).toEqual({
      items: ['Alice', 42, true, null],
    });
  });

  it('parses list of objects (standard syntax)', () => {
    const result = parse('users:\n  -\n    name: Alice\n    age: 30\n  -\n    name: Bob\n    age: 25');
    expect(result).toEqual({
      users: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    });
  });

  // ── Row Syntax ────────────────────────────────────────────────────
  it('parses basic row syntax', () => {
    const result = parse('users(id, name, age):\n    - 1, Alice, 30\n    - 2, Bob, 25');
    expect(result).toEqual({
      users: [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ],
    });
  });

  it('parses row syntax with missing values', () => {
    const result = parse('records(id, name, age):\n    - 1, Alice, 30\n    - 2, Bob\n    - 3, Casey, 28');
    expect(result).toEqual({
      records: [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: null },
        { id: 3, name: 'Casey', age: 28 },
      ],
    });
  });

  it('parses empty row list', () => {
    expect(parse('users(id, name):')).toEqual({ users: [] });
  });

  it('parses single-column row syntax', () => {
    expect(parse('ids(value):\n    - 1\n    - 2\n    - 3')).toEqual({
      ids: [{ value: 1 }, { value: 2 }, { value: 3 }],
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────
  it('parses empty document', () => {
    expect(parse('')).toEqual({});
  });

  it('parses whitespace-only input', () => {
    expect(parse('   \n  \n  ')).toEqual({});
  });

  it('parses comment-only input', () => {
    expect(parse('# just a comment\n# another')).toEqual({});
  });

  it('parses empty value as null', () => {
    expect(parse('empty:')).toEqual({ empty: null });
  });

  it('handles blank lines between keys', () => {
    expect(parse('a: 1\n\nb: 2\n\n\nc: 3')).toEqual({ a: 1, b: 2, c: 3 });
  });

  // ── Indentation ───────────────────────────────────────────────────
  it('works with 2-space indent', () => {
    expect(parse('user:\n  name: Alice\n  age: 30')).toEqual({
      user: { name: 'Alice', age: 30 },
    });
  });

  it('works with 4-space indent', () => {
    expect(parse('user:\n    name: Alice\n    age: 30')).toEqual({
      user: { name: 'Alice', age: 30 },
    });
  });

  it('works with tab indent', () => {
    expect(parse('user:\n\tname: Alice\n\tage: 30')).toEqual({
      user: { name: 'Alice', age: 30 },
    });
  });

  it('rejects mixed indentation', () => {
    expect(() => parse('user:\n  name: Alice\n\t  age: 30')).toThrow();
  });
});

// ============================================================================
// VALIDATOR TESTS
// ============================================================================

describe('LEAN Validator', () => {
  it('validates correct LEAN', () => {
    const result = validate('name: Alice\nage: 30');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects invalid syntax', () => {
    const result = validate('invalid :: syntax');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates empty input', () => {
    expect(validate('').valid).toBe(true);
  });

  it('validates nested structures', () => {
    const result = validate('user:\n  name: Alice\n  age: 30');
    expect(result.valid).toBe(true);
  });

  it('validates row syntax', () => {
    const result = validate('users(id, name):\n  - 1, Alice\n  - 2, Bob');
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// SERIALIZER TESTS
// ============================================================================

describe('LEAN Serializer', () => {
  it('serializes simple object', () => {
    const result = format({ name: 'Alice', age: 30 });
    expect(result).toContain('name: Alice');
    expect(result).toContain('age: 30');
  });

  it('serializes nested objects without dot-notation by default', () => {
    const result = format({ user: { name: 'Alice', age: 30 } });
    expect(result).toContain('user:');
    expect(result).toContain('name: Alice');
    expect(result).toContain('age: 30');
    expect(result).not.toContain('user.');
  });

  it('serializes empty object', () => {
    const result = format({ empty: {} });
    expect(result).toContain('empty: {}');
  });

  it('serializes empty array', () => {
    const result = format({ items: [] });
    expect(result).toContain('items: []');
  });

  it('serializes arrays with row syntax at threshold', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Casey' },
        { id: 4, name: 'Dave' },
      ],
    };
    const result = format(data, { rowThreshold: 4 });
    expect(result).toContain('users(id, name):');
  });

  it('uses standard object list below threshold', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    };
    const result = format(data, { rowThreshold: 4 });
    expect(result).not.toContain('users(');
  });

  it('can enable dot-notation explicitly', () => {
    const result = format({ user: { name: 'Alice', age: 30 } }, { useDotNotation: true });
    expect(result).toContain('user.name: Alice');
  });

  it('handles null values', () => {
    expect(format({ value: null })).toContain('value: null');
  });

  it('handles boolean values', () => {
    const result = format({ a: true, b: false });
    expect(result).toContain('a: true');
    expect(result).toContain('b: false');
  });

  it('handles number values', () => {
    const result = format({ count: 42, price: 19.99, neg: -5 });
    expect(result).toContain('count: 42');
    expect(result).toContain('price: 19.99');
    expect(result).toContain('neg: -5');
  });

  it('sort keys when option is set', () => {
    const result = format({ c: 3, a: 1, b: 2 }, { sortKeys: true });
    const lines = result.trim().split('\n');
    expect(lines[0]).toContain('a:');
    expect(lines[1]).toContain('b:');
    expect(lines[2]).toContain('c:');
  });
});

// ============================================================================
// ROUND-TRIP TESTS
// ============================================================================

describe('LEAN Round-Trip', () => {
  it('preserves simple values', () => {
    const original = 'name: Alice\nage: 25\nactive: true';
    const reparsed = parse(format(parse(original)));
    expect(reparsed).toEqual({ name: 'Alice', age: 25, active: true });
  });

  it('preserves nested objects', () => {
    const original = 'user:\n  name: Alice\n  address:\n    city: Boston\n    zip: 2101';
    const reparsed = parse(format(parse(original)));
    expect(reparsed).toEqual({
      user: { name: 'Alice', address: { city: 'Boston', zip: 2101 } },
    });
  });

  it('preserves arrays', () => {
    const original = 'tags:\n  - news\n  - tech\n  - science';
    const reparsed = parse(format(parse(original)));
    expect(reparsed).toEqual({ tags: ['news', 'tech', 'science'] });
  });

  it('preserves row syntax round-trip', () => {
    const original = 'users(id, name, age):\n  - 1, Alice, 30\n  - 2, Bob, 25';
    const reparsed = parse(format(parse(original)));
    expect(reparsed).toEqual({
      users: [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ],
    });
  });

  it('preserves complex nested structures', () => {
    const original = [
      'blog:',
      '  title: "My Blog"',
      '  tags:',
      '    - tech',
      '    - coding',
      '  posts(id, title):',
      '    - 1, "First Post"',
      '    - 2, "Second Post"',
      '  comments(postId, user, text):',
      '    - 1, Alice, "Great!"',
      '    - 1, Bob, "Nice"',
      '    - 2, Casey, "Interesting"',
    ].join('\n');
    const reparsed = parse(format(parse(original)));
    expect(reparsed).toEqual({
      blog: {
        title: 'My Blog',
        tags: ['tech', 'coding'],
        posts: [
          { id: 1, title: 'First Post' },
          { id: 2, title: 'Second Post' },
        ],
        comments: [
          { postId: 1, user: 'Alice', text: 'Great!' },
          { postId: 1, user: 'Bob', text: 'Nice' },
          { postId: 2, user: 'Casey', text: 'Interesting' },
        ],
      },
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  it('throws on unexpected list item at root', () => {
    expect(() => parse('- invalid')).toThrow('Unexpected list item');
  });

  it('throws on invalid key format', () => {
    expect(() => parse('123invalid: value')).toThrow();
  });

  it('throws on unexpected indentation', () => {
    expect(() => parse('name: Alice\n    invalid: indented')).toThrow();
  });
});

// ============================================================================
// STRICT MODE TESTS
// ============================================================================

describe('Strict Mode', () => {
  it('rejects extra row values in strict mode', () => {
    const input = 'users(id, name):\n  - 1, Alice, extra';
    expect(() => parse(input, { strict: true })).toThrow('Row has 3 values but header defines 2 columns');
  });

  it('allows extra row values in loose mode', () => {
    const input = 'users(id, name):\n  - 1, Alice, extra';
    const result = parse(input, { strict: false }) as Record<string, unknown>;
    expect((result.users as Record<string, unknown>[])[0].id).toBe(1);
    expect((result.users as Record<string, unknown>[])[0].name).toBe('Alice');
  });
});

// ============================================================================
// REAL-WORLD EXAMPLES
// ============================================================================

describe('Real-World Examples', () => {
  it('parses a config file', () => {
    const config = [
      'app:',
      '  name: "My App"',
      '  version: 1.0',
      '  debug: false',
      'database:',
      '  host: localhost',
      '  port: 5432',
      '  credentials:',
      '    user: admin',
      '    password: "secret123"',
      'features:',
      '  - auth',
      '  - api',
      '  - cache',
    ].join('\n');
    const result = parse(config) as Record<string, any>;
    expect(result.app.name).toBe('My App');
    expect(result.database.port).toBe(5432);
    expect(result.features).toHaveLength(3);
  });

  it('parses row syntax with mixed types', () => {
    const input = 'data(str, num, bool, nul):\n  - hello, 42, true, null\n  - world, 3.14, false, null';
    const result = parse(input);
    expect(result).toEqual({
      data: [
        { str: 'hello', num: 42, bool: true, nul: null },
        { str: 'world', num: 3.14, bool: false, nul: null },
      ],
    });
  });
});

// ============================================================================
// PARSE OPTIONS TESTS
// ============================================================================

describe('Parse Options', () => {
  it('throws on non-string input', () => {
    expect(() => (parse as any)(null)).toThrow('Input must be a string');
    expect(() => (parse as any)(42)).toThrow('Input must be a string');
  });

  it('throws when input exceeds maxInputSize', () => {
    const longInput = 'a: ' + 'x'.repeat(100);
    expect(() => parse(longInput, { maxInputSize: 10 })).toThrow(/exceeds maximum size/i);
  });

  it('allows input within maxInputSize', () => {
    expect(parse('a: 1', { maxInputSize: 100 })).toEqual({ a: 1 });
  });
});

// ============================================================================
// PARSE SYNC TESTS
// ============================================================================

describe('parseSync', () => {
  it('parses input synchronously', () => {
    expect(parseSync('a: 1')).toEqual({ a: 1 });
  });
});
