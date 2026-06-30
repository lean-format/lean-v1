import { describe, it, expect } from 'vitest';
import { LeanLexer } from './lexer.js';
import { TokenType } from './types.js';

describe('LeanLexer', () => {
  function tokenize(input: string) {
    const lexer = new LeanLexer(input);
    return lexer.tokenize();
  }

  it('tokenizes a simple key-value pair', () => {
    const tokens = tokenize('key: value');
    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.Identifier);
    expect(types).toContain(TokenType.Colon);
    expect(types).toContain(TokenType.Eof);
  });

  it('tokenizes multiple spaces after colon', () => {
    const tokens = tokenize('key:   value');
    const strToken = tokens.find(t => t.type === TokenType.Identifier);
    expect(strToken).toBeTruthy();
  });

  it('handles comment line (#)', () => {
    const tokens = tokenize('# comment\nkey: val');
    const types = tokens.map(t => t.type);
    expect(types.filter(t => t === TokenType.Newline).length).toBeGreaterThan(0);
    expect(types).toContain(TokenType.Eof);
  });

  it('tokenizes comma', () => {
    const tokens = tokenize('a, b');
    expect(tokens.some(t => t.type === TokenType.Comma)).toBe(true);
  });

  it('tokenizes parentheses', () => {
    const tokens = tokenize('fn(a)');
    expect(tokens.some(t => t.type === TokenType.LParen)).toBe(true);
    expect(tokens.some(t => t.type === TokenType.RParen)).toBe(true);
  });

  it('tokenizes braces', () => {
    const tokens = tokenize('{ a: 1 }');
    expect(tokens.some(t => t.type === TokenType.LBrace)).toBe(true);
    expect(tokens.some(t => t.type === TokenType.RBrace)).toBe(true);
  });

  it('tokenizes brackets', () => {
    const tokens = tokenize('[1, 2]');
    expect(tokens.some(t => t.type === TokenType.LBracket)).toBe(true);
    expect(tokens.some(t => t.type === TokenType.RBracket)).toBe(true);
  });

  it('tokenizes hyphen for list items', () => {
    const tokens = tokenize('- item');
    expect(tokens.some(t => t.type === TokenType.Hyphen)).toBe(true);
  });

  it('handles negative number starts with hyphen', () => {
    const tokens = tokenize('-42');
    expect(tokens.some(t => t.type === TokenType.Number)).toBe(true);
  });

  it('tokenizes indent and dedent', () => {
    const tokens = tokenize('a:\n  b: 1');
    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.Indent);
    expect(types).toContain(TokenType.Dedent);
  });

  it('throws on mixed indentation', () => {
    expect(() => tokenize('a:\n  b: 1\n\tc: 2')).toThrow();
  });

  it('dedents multiple levels at once', () => {
    const tokens = tokenize('a:\n  b:\n    c: 1\n  d: 2');
    const dedents = tokens.filter(t => t.type === TokenType.Dedent);
    expect(dedents.length).toBe(2);
  });

  it('handles indentation on blank/comment-only lines', () => {
    const tokens = tokenize('a:\n  # comment\n  b: 1');
    const types = tokens.map(t => t.type);
    expect(types).toContain(TokenType.Indent);
  });

  it('tokenizes strings with escape sequences', () => {
    const tokens = tokenize('key: "hello\\nworld"');
    const strToken = tokens.find(t => t.type === TokenType.String);
    expect(strToken).toBeTruthy();
  });

  it('tokenizes strings with backslash escape', () => {
    const tokens = tokenize('key: "path\\\\to"');
    const strToken = tokens.find(t => t.type === TokenType.String);
    expect(strToken).toBeTruthy();
  });

  it('tokenizes strings with quote escape', () => {
    const tokens = tokenize('key: "say \\"hi\\""');
    const strToken = tokens.find(t => t.type === TokenType.String);
    expect(strToken).toBeTruthy();
  });

  it('tokenizes strings with tab escape', () => {
    const tokens = tokenize('key: "col\\tcol"');
    const strToken = tokens.find(t => t.type === TokenType.String);
    expect(strToken).toBeTruthy();
  });

  it('tokenizes strings with carriage return escape', () => {
    const tokens = tokenize('key: "line\\rline"');
    const strToken = tokens.find(t => t.type === TokenType.String);
    expect(strToken).toBeTruthy();
  });

  it('throws on unterminated string', () => {
    expect(() => tokenize('key: "unterminated')).toThrow();
  });

  it('throws on unterminated string after backslash at EOF', () => {
    expect(() => tokenize('key: "test\\')).toThrow();
  });

  it('tokenizes numbers including scientific notation', () => {
    const tokens = tokenize('val: 1.5e10');
    expect(tokens.some(t => t.type === TokenType.Number)).toBe(true);
  });

  it('tokenizes negative scientific notation', () => {
    const tokens = tokenize('val: 1e-5');
    expect(tokens.some(t => t.type === TokenType.Number)).toBe(true);
  });

  it('tokenizes keywords true, false, null', () => {
    const t1 = tokenize('true');
    expect(t1.some(t => t.type === TokenType.Boolean)).toBe(true);

    const t2 = tokenize('false');
    expect(t2.some(t => t.type === TokenType.Boolean)).toBe(true);

    const t3 = tokenize('null');
    expect(t3.some(t => t.type === TokenType.Null)).toBe(true);
  });

  it('tokenizes identifiers with dots and dollars', () => {
    const tokens = tokenize('my.key: value');
    const ids = tokens.filter(t => t.type === TokenType.Identifier);
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });

  it('throws on invalid character', () => {
    expect(() => tokenize('a: @invalid')).toThrow(/unexpected character/i);
  });

  it('throws on invalid number format', () => {
    expect(() => tokenize('a: 1e1000')).toThrow(/invalid number/i);
  });

  it('handles number with exponent notation', () => {
    const tokens = tokenize('val: 1e-5');
    expect(tokens.some(t => t.type === TokenType.Number)).toBe(true);
  });
});
