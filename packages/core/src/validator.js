/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
 */

import { LeanParser } from './parser.js';

/**
 * Validate LEAN format text
 * @param {string} input - LEAN text to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, errors: Array<{line, message}> }
 */
export class LeanValidator {
  constructor(options = {}) {
    this.options = options;
  }

  validate(input) {
    return validate(input, this.options);
  }
}

export function validate(input, options = {}) {
  const errors = [];

  try {
    const parser = new LeanParser(options);
    parser.parse(input);
    return { valid: true, errors: [] };
  } catch (error) {
    // Handle both "Line X: message" and "LEAN Parse Error at line X: message" formats
    const match = error.message.match(/(?:LEAN Parse Error at )?line (\d+): (.+)/i);
    if (match) {
      errors.push({
        line: parseInt(match[1]),
        message: match[2]
      });
    } else {
      errors.push({
        line: null,
        message: error.message
      });
    }
    return { valid: false, errors };
  }
}
