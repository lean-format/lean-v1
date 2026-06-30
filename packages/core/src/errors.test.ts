import { describe, it, expect } from 'vitest';
import { LeanParseError, LeanSerializeError, ErrorCode } from './errors.js';

describe('LEAN Errors', () => {
  it('LeanParseError with defaults', () => {
    const err = new LeanParseError('test error');
    expect(err.message).toBe('LEAN Parse Error: test error');
    expect(err.line).toBe(0);
    expect(err.column).toBe(0);
    expect(err.name).toBe('LeanParseError');
    expect(err.code).toBe(ErrorCode.PARSE_ERROR);
  });

  it('LeanParseError with line and column', () => {
    const err = new LeanParseError('test', 5, 10);
    expect(err.message).toContain('at line 5, column 10');
    expect(err.line).toBe(5);
    expect(err.column).toBe(10);
  });

  it('LeanParseError with line only', () => {
    const err = new LeanParseError('test', 5);
    expect(err.message).toContain('at line 5');
    expect(err.message).not.toContain('column');
  });

  it('LeanParseError with snippet and suggestion', () => {
    const err = new LeanParseError('test', 1, 2, 'snip', 'try this', ErrorCode.UNTERMINATED_STRING);
    expect(err.snippet).toBe('snip');
    expect(err.suggestion).toBe('try this');
    expect(err.code).toBe(ErrorCode.UNTERMINATED_STRING);
  });

  it('LeanParseError toValidationError with column > 0', () => {
    const err = new LeanParseError('msg', 3, 7, 'snip', 'suggest');
    const ve = err.toValidationError();
    expect(ve.line).toBe(3);
    expect(ve.column).toBe(7);
    expect(ve.message).toContain('msg');
    expect(ve.snippet).toBe('snip');
    expect(ve.suggestion).toBe('suggest');
  });

  it('LeanParseError toValidationError with column 0', () => {
    const err = new LeanParseError('msg', 3, 0);
    const ve = err.toValidationError();
    expect(ve.line).toBe(3);
    expect(ve.column).toBeUndefined();
  });

  it('LeanSerializeError with default code', () => {
    const err = new LeanSerializeError('serialize failed');
    expect(err.message).toContain('serialize failed');
    expect(err.name).toBe('LeanSerializeError');
    expect(err.code).toBe(ErrorCode.SERIALIZE_ERROR);
  });

  it('LeanSerializeError with custom code', () => {
    const err = new LeanSerializeError('unsupported', ErrorCode.UNSUPPORTED_VALUE);
    expect(err.code).toBe(ErrorCode.UNSUPPORTED_VALUE);
  });

  it('ErrorCode constants', () => {
    expect(ErrorCode.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(ErrorCode.UNTERMINATED_STRING).toBe('UNTERMINATED_STRING');
    expect(ErrorCode.SERIALIZE_ERROR).toBe('SERIALIZE_ERROR');
    expect(ErrorCode.UNSUPPORTED_VALUE).toBe('UNSUPPORTED_VALUE');
    expect(ErrorCode.DUPLICATE_KEY).toBe('DUPLICATE_KEY');
  });
});
