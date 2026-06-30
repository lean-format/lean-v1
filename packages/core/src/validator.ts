import { parse } from './parser.js';
import { LeanParseError } from './errors.js';
import type { ParseOptions, ValidationResult } from './types.js';

/**
 * Validate LEAN format text.
 *
 * @param input - LEAN text to validate
 * @param options - Validation options
 * @returns Array of validation results
 */
export function validate(input: string, options: ParseOptions = {}): ValidationResult[] {
  const errors: ValidationResult[] = [];

  try {
    const parserOptions: ParseOptions = {
      strict: options.strict ?? false,
    };
    parse(input, parserOptions);
    return [];
  } catch (error) {
    if (error instanceof LeanParseError) {
      const line = error.line ?? 0;
      const column = error.column ?? 0;
      errors.push({
        message: error.message,
        loc: {
          start: { line, column, offset: 0 },
          end: { line, column, offset: 0 },
        },
        severity: 'error',
      });
    } else if (error instanceof Error) {
      const lineMatch = error.message.match(/(?:line|at line) (\d+)/i);
      const colMatch = error.message.match(/(?:column|col) (\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1], 10) : 0;
      const column = colMatch ? parseInt(colMatch[1], 10) : 0;
      errors.push({
        message: error.message,
        loc: {
          start: { line, column, offset: 0 },
          end: { line, column, offset: 0 },
        },
        severity: 'error',
      });
    } else {
      errors.push({
        message: String(error),
        loc: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
        severity: 'error',
      });
    }

    return errors;
  }
}

/**
 * Validate LEAN format text and throw on first error.
 * Useful for strict validation where any issue should stop processing.
 *
 * @param input - LEAN text to validate
 * @param options - Validation options
 * @throws {LeanParseError} If validation fails
 */
export function validateStrict(input: string, options: ParseOptions = {}): void {
  const results = validate(input, { ...options, strict: true });
  if (results.length > 0) {
    const err = results[0];
    throw new LeanParseError(err.message, err.loc.start.line, err.loc.start.column);
  }
}
