import { describe, it, expect } from 'vitest';
import { JsLeanParser } from './js-parser.js';

describe('JsLeanParser', () => {
  describe('depth checking', () => {
    it('throws when maxDepth is exceeded (inline objects)', () => {
      const parser = new JsLeanParser(false, { maxDepth: 1 });
      expect(() => parser.parse('a: {b: {c: 1}}')).toThrow(/depth/i);
    });

    it('throws when maxDepth is exceeded (block)', () => {
      const parser = new JsLeanParser(false, { maxDepth: 1 });
      expect(() => parser.parse('a:\n  b:\n    c: 1')).toThrow(/depth/i);
    });

    it('throws when maxDepth is exceeded (inline array containing object)', () => {
      const parser = new JsLeanParser(false, { maxDepth: 1 });
      expect(() => parser.parse('a: [{b: {c: 1}}]')).toThrow(/depth/i);
    });
  });

  describe('deep merge', () => {
    it('deep merges duplicate object keys', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  b: 1\na:\n  c: 2');
      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });

    it('replaces non-object with object on duplicate key', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a: 1\na:\n  b: 2');
      expect(result).toEqual({ a: { b: 2 } });
    });

    it('replaces object with non-object on duplicate key', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  b: 1\na: 2');
      expect(result).toEqual({ a: 2 });
    });
  });

  describe('dot notation', () => {
    it('expands dot notation in keys', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a.b.c: 1');
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it('expands dot notation in keys with block value', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a.b:\n  c: 1');
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it('expands dot notation in row list keys', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a.b(x, y):\n  - 1, 2');
      expect(result).toEqual({ a: { b: [{ x: 1, y: 2 }] } });
    });

    it('passes through dotted key in empty row list (no expansion)', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a.b(x):\n  ');
      expect(result).toEqual({ 'a.b': [] });
    });
  });

  describe('empty values', () => {
    it('handles empty value after colon (no indent)', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\nb: 1');
      expect(result).toEqual({ a: null, b: 1 });
    });

    it('handles empty value after colon at EOF', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:');
      expect(result).toEqual({ a: null });
    });
  });

  describe('parseValue newlines', () => {
    it('handles multiple newlines before block value', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n\n\n  b: 1');
      expect(result).toEqual({ a: { b: 1 } });
    });

    it('handles multiple newlines after block value', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  b: 1\n\n\nc: 2');
      expect(result).toEqual({ a: { b: 1 }, c: 2 });
    });

    it('handles multiple newlines before simple value', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n\n\nb: 1');
      expect(result).toEqual({ a: null, b: 1 });
    });
  });

  describe('inline objects', () => {
    it('parses inline object with multiple keys', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a: {b: 1, c: 2}');
      expect(result).toEqual({ a: { b: 1, c: 2 } });
    });

    it('parses inline empty object', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a: {}');
      expect(result).toEqual({ a: {} });
    });

    it('throws on unclosed inline object', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse('a: {b: 1')).toThrow(/\}|rbrace/i);
    });

    it('throws on missing colon in inline object', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse('a: {b 1}')).toThrow();
    });

    it('throws on non-identifier key in inline object', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse('a: {1: b}')).toThrow();
    });
  });

  describe('inline arrays', () => {
    it('parses inline array with multiple items', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a: [1, 2, 3]');
      expect(result).toEqual({ a: [1, 2, 3] });
    });

    it('parses inline empty array', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a: []');
      expect(result).toEqual({ a: [] });
    });

    it('throws on unclosed inline array', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse('a: [1')).toThrow(/\]|rbracket/i);
    });
  });

  describe('block values', () => {
    it('parses key with block value containing list', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  - 1\n  - 2');
      expect(result).toEqual({ a: [1, 2] });
    });

    it('parses key with block value containing object', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  b: 1');
      expect(result).toEqual({ a: { b: 1 } });
    });
  });

  describe('nested lists', () => {
    it('parses nested list inside key value', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  -\n    - inner');
      expect(result).toEqual({ a: [['inner']] });
    });

    it('parses list with nested key-value objects', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  - b: 1\n    c: 2');
      expect(result).toEqual({ a: [{ b: 1, c: 2 }] });
    });
  });

  describe('list item parsing', () => {
    it('parses list item with simple value', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  - val1\n  - val2');
      expect(result).toEqual({ a: ['val1', 'val2'] });
    });

    it('parses list item with key-value pair', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  - b: 1');
      expect(result).toEqual({ a: [{ b: 1 }] });
    });

    it('parses list item with key-value pair and indented block extension', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  - b: 1\n    c: 2');
      expect(result).toEqual({ a: [{ b: 1, c: 2 }] });
    });

    it('parses list item of inline object with indent block', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a:\n  - b: 1\n    c: 2\n    d: 3');
      expect(result).toEqual({ a: [{ b: 1, c: 2, d: 3 }] });
    });
  });

  describe('parser errors', () => {
    it('throws on unexpected token for value', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse('a: ,')).toThrow();
    });

    it('throws on consume expecting wrong token', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse(':')).toThrow(/expected/i);
    });
  });

  describe('empty row list variations', () => {
    it('handles row list with comment-only line before content', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a(x):\n  - 1\n  - 2');
      expect(result).toEqual({ a: [{ x: 1 }, { x: 2 }] });
    });
  });

  describe('unexpected hyphen in parseItem', () => {
    it('throws when hyphen appears where key is expected', () => {
      const parser = new JsLeanParser(false);
      expect(() => parser.parse('a:\n  -: val')).toThrow();
    });
  });

  describe('strict mode', () => {
    it('throws on duplicate keys in strict mode', () => {
      const parser = new JsLeanParser(true);
      expect(() => parser.parse('a: 1\na: 2')).toThrow(/duplicate/i);
    });

    it('allows duplicate keys in non-strict mode', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a: 1\na: 2');
      expect(result).toEqual({ a: 2 });
    });
  });

  describe('row list', () => {
    it('parses row list with multiple rows', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a(x, y):\n  - 1, 2\n  - 3, 4');
      expect(result).toEqual({ a: [{ x: 1, y: 2 }, { x: 3, y: 4 }] });
    });

    it('parses row list with trailing comma', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a(x):\n  - 1,\n  - 2');
      expect(result).toEqual({ a: [{ x: 1 }, { x: 2 }] });
    });

    it('parses empty row list at EOF', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a(x):');
      expect(result).toEqual({ a: [] });
    });

    it('parses row list with multiple values per row', () => {
      const parser = new JsLeanParser(false);
      const result = parser.parse('a(x, y):\n  - 1, 2, 3');
      expect(result).toEqual({ a: [{ x: 1, y: 2 }] });
    });
  });
});
