import { LeanParser } from './parser.js';
import { toLean } from './serializer.js';
import { validate } from './validator.js';


/**
 * Parse LEAN format text into JavaScript object
 * @param {string} input - LEAN format text
 * @param {Object} options - Parser options
 * @param {boolean} options.strict - Enable strict mode validation
 * @returns {Object} Parsed JavaScript object
 * @throws {Error} If parsing fails
 * @example
 * const data = parse(`
 *   users(id, name):
 *     - 1, Alice
 *     - 2, Bob
 * `);
 */
function parse(input, options = {}) {
  const parser = new LeanParser(options);
  return parser.parse(input);
}

/**
 * Convert JavaScript object to LEAN format
 * @param {Object} obj - JavaScript object to serialize
 * @param {Object} options - Serialization options
 * @param {string} options.indent - Indentation string (default: '  ')
 * @param {boolean} options.useRowSyntax - Enable row syntax optimization (default: true)
 * @param {number} options.rowThreshold - Minimum items for row syntax (default: 3)
 * @returns {string} LEAN format text
 * @example
 * const lean = format({ users: [{ id: 1, name: 'Alice' }] });
 */
function format(obj, options = {}) {
  return toLean(obj, options);
}

/**
 * Validate LEAN format text
 * @param {string} input - LEAN format text
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Enable strict mode
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 * @example
 * const result = validate(leanText);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 */
function validateInput(input, options = {}) {
  return validate(input, options);
}

export { parse, format, validateInput as validate, LeanParser, toLean };
