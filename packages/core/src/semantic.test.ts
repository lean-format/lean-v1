import { describe, it, expect } from 'vitest';
import { analyze, formatWarnings, hasWarnings } from './semantic.js';
import { parse } from './parser.js';

describe('Semantic Analysis', () => {
  it('returns no warnings for clean input', () => {
    const input = 'name: Alice\nage: 30';
    const parsed = parse(input);
    const result = analyze(input, parsed);
    expect(result.warnings).toHaveLength(0);
  });

  it('detects trailing commas', () => {
    const input = 'value: [1,\n]';
    const parsed = parse('value: [1]');
    const result = analyze(input, parsed);
    const trailingComma = result.warnings.filter(w => w.type === 'trailing-comma');
    expect(trailingComma.length).toBeGreaterThan(0);
  });

  it('detects mixed indentation in source text', () => {
    const input = 'key: val\n  nested:\n\tvalue: 1\n  other: 2';
    const parsed = parse('key:\n  val:\n    nested:\n      value: 1\n    other: 2');
    const result = analyze(input, parsed);
    const mixed = result.warnings.filter(w => w.type === 'mixed-indent');
    expect(mixed.length).toBeGreaterThan(0);
  });

  it('detects type inconsistency', () => {
    const parsed = parse('key:\n  - value: hello\n  - value: 42');
    const input = 'key:\n  - value: hello\n  - value: 42';
    const result = analyze(input, parsed);
    const typeWarnings = result.warnings.filter(w => w.type === 'type-inconsistency');
    expect(typeWarnings.length).toBeGreaterThan(0);
  });

  it('detects type inconsistency with > 2 types', () => {
    const parsed = parse('key:\n  - val: a\n  - val: 1\n  - val: true');
    const input = 'key:\n  - val: a\n  - val: 1\n  - val: true';
    const result = analyze(input, parsed);
    const typeWarnings = result.warnings.filter(w => w.type === 'type-inconsistency');
    expect(typeWarnings.length).toBeGreaterThan(0);
  });

  it('detects suspicious ref', () => {
    const input = '$ref: hello';
    const parsed = parse(input);
    const result = analyze(input, parsed);
    const refWarnings = result.warnings.filter(w => w.type === 'suspicious-ref');
    expect(refWarnings.length).toBeGreaterThan(0);
  });

  it('does not warn on valid $ref', () => {
    const input = '$ref: $.path.to.value';
    const parsed = parse(input);
    const result = analyze(input, parsed);
    const refWarnings = result.warnings.filter(w => w.type === 'suspicious-ref');
    expect(refWarnings.length).toBe(0);
  });

  it('hasWarnings returns false for clean result', () => {
    expect(hasWarnings({ warnings: [] })).toBe(false);
  });

  it('hasWarnings returns true for warnings', () => {
    expect(hasWarnings({ warnings: [{ type: 'trailing-comma', path: '', message: '' }] })).toBe(true);
  });

  it('formatWarnings returns empty string for no warnings', () => {
    expect(formatWarnings({ warnings: [] })).toBe('');
  });

  it('formatWarnings produces output', () => {
    const result = { warnings: [{ type: 'trailing-comma' as const, path: 'line 3', message: 'Trailing comma on line 3', suggestion: 'Remove it.' }] };
    const output = formatWarnings(result, false);
    expect(output).toContain('Trailing comma');
    expect(output).toContain('Remove it.');
  });

  it('formatWarnings works with _colors param', () => {
    const result = { warnings: [{ type: 'mixed-indent' as const, path: '', message: 'mix' }] };
    expect(formatWarnings(result, true)).toContain('mix');
    expect(formatWarnings(result, false)).toContain('mix');
  });

  it('warns on empty/null values', () => {
    const input = 'a:';
    const parsed = parse(input);
    const result = analyze(input, parsed);
    const emptyWarnings = result.warnings.filter(w => w.type === 'empty-value');
    expect(emptyWarnings.length).toBeGreaterThan(0);
  });
});
