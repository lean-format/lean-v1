import type { ValidationError } from './types.js';

/**
 * Error codes for structured error handling.
 */
export const ErrorCode = {
  PARSE_ERROR: 'PARSE_ERROR',
  UNEXPECTED_TOKEN: 'UNEXPECTED_TOKEN',
  UNEXPECTED_CHARACTER: 'UNEXPECTED_CHARACTER',
  UNTERMINATED_STRING: 'UNTERMINATED_STRING',
  INVALID_NUMBER: 'INVALID_NUMBER',
  EXPECTED_COLON: 'EXPECTED_COLON',
  EXPECTED_KEY: 'EXPECTED_KEY',
  EXPECTED_RBRACE: 'EXPECTED_RBRACE',
  EXPECTED_RBRACKET: 'EXPECTED_RBRACKET',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  EXTRA_ROW_VALUES: 'EXTRA_ROW_VALUES',
  MIXED_INDENTATION: 'MIXED_INDENTATION',
  UNEXPECTED_INDENT: 'UNEXPECTED_INDENT',
  DEPTH_EXCEEDED: 'DEPTH_EXCEEDED',
  INPUT_TOO_LARGE: 'INPUT_TOO_LARGE',
  INVALID_INPUT: 'INVALID_INPUT',
  SERIALIZE_ERROR: 'SERIALIZE_ERROR',
  UNSUPPORTED_VALUE: 'UNSUPPORTED_VALUE',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Structured LEAN parse error with location information and error code.
 */
export class LeanParseError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly snippet?: string;
  public readonly suggestion?: string;
  public readonly code: ErrorCodeType;

  constructor(
    message: string,
    line: number = 0,
    column: number = 0,
    snippet?: string,
    suggestion?: string,
    code: ErrorCodeType = ErrorCode.PARSE_ERROR,
  ) {
    const loc = line > 0 ? ` at line ${line}${column > 0 ? `, column ${column}` : ''}` : '';
    super(`LEAN Parse Error${loc}: ${message}`);
    this.name = 'LeanParseError';
    this.line = line;
    this.column = column;
    this.snippet = snippet;
    this.suggestion = suggestion;
    this.code = code;
  }

  /** Convert to a ValidationError */
  toValidationError(): ValidationError {
    return {
      line: this.line,
      column: this.column > 0 ? this.column : undefined,
      message: this.message,
      suggestion: this.suggestion,
      snippet: this.snippet,
    };
  }
}

/**
 * Serialization error with error code.
 */
export class LeanSerializeError extends Error {
  public readonly code: ErrorCodeType;

  constructor(message: string, code: ErrorCodeType = ErrorCode.SERIALIZE_ERROR) {
    super(`LEAN Serialize Error: ${message}`);
    this.name = 'LeanSerializeError';
    this.code = code;
  }
}
