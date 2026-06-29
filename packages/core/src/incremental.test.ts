import { describe, it, expect } from 'vitest';
import { IncrementalParser, parseIncremental } from './incremental.js';

describe('IncrementalParser', () => {
  it('parses a document from scratch', () => {
    const parser = new IncrementalParser();
    const result = parser.parse('name: Alice\nage: 30') as Record<string, unknown>;
    expect(result.name).toBe('Alice');
    expect(result.age).toBe(30);
  });

  it('returns cached result for identical input', () => {
    const parser = new IncrementalParser();
    const input = 'name: Alice';
    const r1 = parser.parse(input);
    const r2 = parser.parse(input);
    expect(r1).toBe(r2);
  });

  it('re-parses changed top-level block', () => {
    const parser = new IncrementalParser();
    const result1 = parser.parse('name: Alice\nage: 30') as Record<string, unknown>;
    expect(result1.name).toBe('Alice');

    const result2 = parser.parse('name: Bob\nage: 30') as Record<string, unknown>;
    expect(result2.name).toBe('Bob');
    expect(result2.age).toBe(30);
  });

  it('preserves unchanged blocks after partial update', () => {
    const parser = new IncrementalParser();
    const docs = [
      `user:\n  name: Alice\n  age: 30\nsettings:\n  theme: dark`,
      `user:\n  name: Bob\n  age: 30\nsettings:\n  theme: dark`,
    ];

    parser.parse(docs[0]);
    const r2 = parser.parse(docs[1]) as Record<string, unknown>;

    expect((r2.user as any).name).toBe('Bob');
    expect((r2.settings as any).theme).toBe('dark');
  });

  it('reset clears previous state', () => {
    const parser = new IncrementalParser();
    parser.parse('name: Alice');
    parser.reset();
    expect(parser.prevTextLen).toBe(0);

    const result = parser.parse('name: Bob') as Record<string, unknown>;
    expect(result.name).toBe('Bob');
  });

  it('parseIncremental uses default parser', () => {
    const result = parseIncremental('key: value') as Record<string, unknown>;
    expect(result.key).toBe('value');
  });
});
