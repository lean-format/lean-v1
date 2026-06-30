import type { ParseOptions, ValidationResult } from './types.js';
/**
 * Validate LEAN format text.
 *
 * @param input - LEAN text to validate
 * @param options - Validation options
 * @returns Array of validation results
 */
export declare function validate(input: string, options?: ParseOptions): ValidationResult[];
/**
 * Validate LEAN format text and throw on first error.
 * Useful for strict validation where any issue should stop processing.
 *
 * @param input - LEAN text to validate
 * @param options - Validation options
 * @throws {LeanParseError} If validation fails
 */
export declare function validateStrict(input: string, options?: ParseOptions): void;
//# sourceMappingURL=validator.d.ts.map