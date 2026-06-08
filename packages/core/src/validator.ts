import { parse } from './parser.js';
import { LeanParseError } from './errors.js';
import type { ParseOptions, ValidationError, ValidationResult } from './types.js';

/**
 * Validate LEAN format text.
 *
 * @param input - LEAN text to validate
 * @param options - Validation options
 * @returns Validation result with errors if invalid
 */
export function validate(input: string, options: ParseOptions = {}): ValidationResult {
  const errors: ValidationError[] = [];

  try {
    const parserOptions: ParseOptions = {
      strict: options.strict ?? false,
    };
    parse(input, parserOptions);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof LeanParseError) {
      errors.push(error.toValidationError());
    } else if (error instanceof Error) {
      // Try to extract line/column from various error formats
      const lineMatch = error.message.match(/(?:LEAN Parse Error at )?(?:line|at line) (\d+)/i);
      const colMatch = error.message.match(/(?:column|col) (\d+)/i);
      errors.push({
        line: lineMatch ? parseInt(lineMatch[1], 10) : 0,
        column: colMatch ? parseInt(colMatch[1], 10) : undefined,
        message: error.message,
      });
    } else {
      errors.push({
        line: 0,
        message: String(error),
      });
    }

    return { valid: false, errors };
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
  const result = validate(input, { ...options, strict: true });
  if (!result.valid && result.errors.length > 0) {
    const err = result.errors[0];
    throw new LeanParseError(err.message, err.line, err.column, err.snippet, err.suggestion);
  }
}
