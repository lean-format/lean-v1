import type { ValidationError } from './types.js';

/**
 * Structured LEAN parse error with location information.
 */
export class LeanParseError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly snippet?: string;
  public readonly suggestion?: string;

  constructor(
    message: string,
    line: number = 0,
    column: number = 0,
    snippet?: string,
    suggestion?: string,
  ) {
    const loc = line > 0 ? ` at line ${line}${column > 0 ? `, column ${column}` : ''}` : '';
    super(`LEAN Parse Error${loc}: ${message}`);
    this.name = 'LeanParseError';
    this.line = line;
    this.column = column;
    this.snippet = snippet;
    this.suggestion = suggestion;
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
 * Serialization error.
 */
export class LeanSerializeError extends Error {
  constructor(message: string) {
    super(`LEAN Serialize Error: ${message}`);
    this.name = 'LeanSerializeError';
  }
}
