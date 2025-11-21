/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
 */

import { LeanParser } from './parser.js';
import { LeanSerializer } from './serializer.js';
import { LeanValidator } from './validator.js';
import { Lexer, TokenType } from './lexer.js';

/**
 * Parse LEAN format text into JavaScript object
 * @param {string} input - LEAN format text
 * @param {object} options - Configuration options
 * @returns {object} Parsed JavaScript object
 */
export function parse(input, options = {}) {
  const parser = new LeanParser(options);
  return parser.parse(input);
}

/**
 * Format JavaScript object as LEAN text
 * @param {object} obj - JavaScript object
 * @param {object} options - Configuration options
 * @returns {string} LEAN format text
 */
export function format(obj, options = {}) {
  const serializer = new LeanSerializer(options);
  return serializer.serialize(obj);
}

/**
 * Validate LEAN format text
 * @param {string} input - LEAN format text
 * @param {object} options - Configuration options
 * @returns {object} Validation result { valid, errors }
 */
export function validate(input, options = {}) {
  const validator = new LeanValidator(options);
  return validator.validate(input);
}

export { LeanParser, LeanSerializer, LeanValidator, Lexer, TokenType };

// Schema validation
export { validateSchema, SchemaValidator } from './schema.js';
