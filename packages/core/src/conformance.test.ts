import { describe, it, expect } from 'vitest';
import { parse, format } from './index.js';

// ============================================================================
// PARSER CONFORMANCE TESTS
// ============================================================================
// These tests verify spec compliance and are used to ensure Rust ↔ JS parser parity.

describe('Parser Conformance', () => {
  // ── Basic Types (§4) ──────────────────────────────────────────────────
  it('parses all primitive value types', () => {
    const input = [
      'str: hello',
      'qstr: "quoted string"',
      'int: 42',
      'float: 3.14',
      'neg: -5',
      'bool_t: true',
      'bool_f: false',
      'nil: null',
    ].join('\n');
    const result = parse(input) as Record<string, unknown>;
    expect(result.str).toBe('hello');
    expect(result.qstr).toBe('quoted string');
    expect(result.int).toBe(42);
    expect(result.float).toBe(3.14);
    expect(result.neg).toBe(-5);
    expect(result.bool_t).toBe(true);
    expect(result.bool_f).toBe(false);
    expect(result.nil).toBeNull();
  });

  // ── Comments (§6) ─────────────────────────────────────────────────────
  it('parses inline comments', () => {
    expect(parse('key: val # comment')).toEqual({ key: 'val' });
  });

  it('parses whole-line comments', () => {
    const input = '# top comment\nkey: val\n# middle\nkey2: val2\n# end';
    expect(parse(input)).toEqual({ key: 'val', key2: 'val2' });
  });

  it('parses multi-line comments', () => {
    expect(parse('# line1\n# line2\nkey: val')).toEqual({ key: 'val' });
  });

  // ── Nested Objects (§7) ──────────────────────────────────────────────
  it('parses nested objects with various indent sizes', () => {
    const results = [
      parse('a:\n  b:\n    c: deep'),
      parse('a:\n    b:\n        c: deep'),
    ];
    for (const result of results) {
      expect(result).toEqual({ a: { b: { c: 'deep' } } });
    }
  });

  it('parses multiple siblings at same level', () => {
    const result = parse('a:\n  b: 1\n  c: 2\nd:\n  e: 3');
    expect(result).toEqual({ a: { b: 1, c: 2 }, d: { e: 3 } });
  });

  // ── Lists (§8) ───────────────────────────────────────────────────────
  it('parses list of primitives', () => {
    expect(parse('items:\n  - a\n  - b\n  - c')).toEqual({ items: ['a', 'b', 'c'] });
  });

  it('parses list of mixed types', () => {
    expect(parse('mix:\n  - hello\n  - 42\n  - true\n  - null')).toEqual({
      mix: ['hello', 42, true, null],
    });
  });

  it('parses list of objects (standard syntax)', () => {
    const input = 'users:\n  -\n    name: Alice\n    age: 30\n  -\n    name: Bob\n    age: 25';
    expect(parse(input)).toEqual({
      users: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    });
  });

  it('parses empty list', () => {
    expect(parse('empty: []')).toEqual({ empty: [] });
  });

  it('parses empty object inline', () => {
    expect(parse('empty: {}')).toEqual({ empty: {} });
  });

  // ── Row Syntax (§9) ──────────────────────────────────────────────────
  it('parses row syntax with string values', () => {
    const result = parse('data(str, num, bool):\n  - hello, 42, true');
    expect(result).toEqual({ data: [{ str: 'hello', num: 42, bool: true }] });
  });

  it('parses row syntax with all nulls', () => {
    const result = parse('data(a, b):\n  - null, null');
    expect(result).toEqual({ data: [{ a: null, b: null }] });
  });

  it('parses empty row list (no rows)', () => {
    expect(parse('empty(id, name):')).toEqual({ empty: [] });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────
  it('parses empty document as empty object', () => {
    expect(parse('')).toEqual({});
  });

  it('parses blank lines between keys', () => {
    expect(parse('a: 1\n\nb: 2')).toEqual({ a: 1, b: 2 });
  });

  it('parses blank lines at start and end', () => {
    expect(parse('\n\nkey: val\n\n')).toEqual({ key: 'val' });
  });
});

// ============================================================================
// ROUND-TRIP TESTS: parse(format(parse(input))) === parse(input)
// ============================================================================

describe('Round-Trip (parse ∘ format ∘ parse)', () => {
  const testCases: string[] = [
    // Simple values
    'name: Alice\nage: 25\nactive: true\nscore: null',
    // Nested objects
    'user:\n  name: Alice\n  address:\n    city: Boston\n    zip: "02101"',
    // Primitive lists
    'tags:\n  - news\n  - tech\n  - science',
    // Deep nesting
    'a:\n  b:\n    c:\n      d: deep',
    // Multiple top-level keys
    'a: 1\nb: 2\nc: 3',
    // Quoted strings
    'msg: "Hello, world!"\npath: "C:\\\\Users\\\\test"',
    // Mixed types
    'mix:\n  - hello\n  - 42\n  - true\n  - null',
    // List of objects
    'users:\n  -\n    name: Alice\n    age: 30\n  -\n    name: Bob\n    age: 25',
  ];

  for (const input of testCases) {
    it(`round-trips: ${input.split('\n')[0]}...`, () => {
      const parsed = parse(input);
      const serialized = format(parsed);
      const reparsed = parse(serialized);
      expect(reparsed).toEqual(parsed);
    });
  }
});

// ============================================================================
// ROUND-TRIP WITH ROW SYNTAX
// ============================================================================

describe('Round-Trip with Row Syntax', () => {
  const testCases: string[] = [
    'users(id, name, age):\n  - 1, Alice, 30\n  - 2, Bob, 25',
    'data(str, num, bool, nul):\n  - hello, 42, true, null\n  - world, 3.14, false, null',
    'products(id, name, price):\n  - 1, Widget, 19.99\n  - 2, Gadget, 29.99',
    'records(id, name, age):\n  - 1, Alice, 30\n  - 2, Bob\n  - 3, Casey, 28',
  ];

  for (const input of testCases) {
    it(`round-trips row syntax: ${input.split('\n')[0]}`, () => {
      const parsed = parse(input);
      const serialized = format(parsed);
      const reparsed = parse(serialized);
      expect(reparsed).toEqual(parsed);
    });
  }
});

// ============================================================================
// ROUND-TRIP WITH OPTIONS
// ============================================================================

describe('Round-Trip with Options', () => {
  it('preserves data with sortKeys enabled', () => {
    const input = 'c: 3\na: 1\nb: 2';
    const parsed = parse(input);
    const serialized = format(parsed, { sortKeys: true });
    const reparsed = parse(serialized);
    expect(reparsed).toEqual(parsed);
  });

  it('preserves data with custom indent', () => {
    const input = 'user:\n    name: Alice\n    age: 30';
    const parsed = parse(input);
    const serialized = format(parsed, { indent: '    ' });
    const reparsed = parse(serialized);
    expect(reparsed).toEqual(parsed);
  });
});

// ============================================================================
// STRICT MODE CONFORMANCE
// ============================================================================

describe('Strict Mode Conformance', () => {
  it('rejects extra row values', () => {
    const input = 'users(id, name):\n  - 1, Alice, extra, extra2';
    expect(() => parse(input, { strict: true })).toThrow();
  });

  it('rejects duplicate keys', () => {
    expect(() => parse('key: 1\nkey: 2', { strict: true })).toThrow();
  });

  it('allows extra row values in non-strict mode', () => {
    const input = 'users(id, name):\n  - 1, Alice, extra';
    const result = parse(input, { strict: false }) as Record<string, unknown>;
    expect((result.users as Record<string, unknown>[])[0].id).toBe(1);
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

describe('Error Handling Conformance', () => {
  it('throws on invalid input type', () => {
    expect(() => (parse as Function)(null)).toThrow('Input must be a string');
  });

  it('throws on unexpected list item at root', () => {
    expect(() => parse('- invalid')).toThrow('Unexpected list item');
  });

  it('throws on bad key format', () => {
    expect(() => parse('123invalid: value')).toThrow();
  });

  it('rejects mixed indent', () => {
    expect(() => parse('key:\n  val\n\tbad')).toThrow();
  });
});
