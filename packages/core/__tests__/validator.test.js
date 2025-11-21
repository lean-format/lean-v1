import { describe, it, expect } from '@jest/globals';
import { LeanValidator } from '../src/validator.js';

describe('LeanValidator', () => {
    describe('Basic Validation', () => {
        it('should validate valid LEAN content', () => {
            const validator = new LeanValidator();
            const result = validator.validate('name: Alice\nage: 30');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect mixed indentation', () => {
            const validator = new LeanValidator();
            const result = validator.validate('name: Alice\n\tage: 30');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].message).toContain('Unexpected indentation');
        });

        it('should validate nested structures', () => {
            const validator = new LeanValidator();
            const content = `user:
  name: Alice
  age: 30`;
            const result = validator.validate(content);
            expect(result.valid).toBe(true);
        });

        it('should validate lists', () => {
            const validator = new LeanValidator();
            const content = `items:
  - apple
  - banana
  - cherry`;
            const result = validator.validate(content);
            expect(result.valid).toBe(true);
        });

        it('should validate row syntax', () => {
            const validator = new LeanValidator();
            const content = `users(id, name):
  - 1, Alice
  - 2, Bob`;
            const result = validator.validate(content);
            expect(result.valid).toBe(true);
        });
    });

    describe('Error Detection', () => {
        it('should detect invalid syntax', () => {
            const validator = new LeanValidator();
            const result = validator.validate('invalid :: syntax');
            expect(result.valid).toBe(false);
        });

        it('should handle empty input', () => {
            const validator = new LeanValidator();
            const result = validator.validate('');
            expect(result.valid).toBe(true);
        });

        it('should handle comment-only input', () => {
            const validator = new LeanValidator();
            const result = validator.validate('# Just a comment');
            expect(result.valid).toBe(true);
        });

        it('should handle whitespace-only input', () => {
            const validator = new LeanValidator();
            const result = validator.validate('   \n  \n  ');
            expect(result.valid).toBe(true);
        });
    });

    describe('Strict Mode', () => {
        it('should work in strict mode', () => {
            const validator = new LeanValidator({ strict: true });
            const result = validator.validate('name: Alice\nage: 30');
            expect(result.valid).toBe(true);
        });

        it('should detect errors in strict mode', () => {
            const validator = new LeanValidator({ strict: true });
            const result = validator.validate('invalid :: syntax');
            expect(result.valid).toBe(false);
        });
    });

    describe('Complex Structures', () => {
        it('should validate complex nested structure', () => {
            const validator = new LeanValidator();
            const content = `project:
  name: "My Project"
  version: 1.0
  users(id, name, active):
    - 1, Alice, true
    - 2, Bob, false
  config:
    debug: false
    timeout: 5000`;
            const result = validator.validate(content);
            expect(result.valid).toBe(true);
        });

        it('should validate inline comments', () => {
            const validator = new LeanValidator();
            const content = `name: Alice  # User name
age: 30  # User age`;
            const result = validator.validate(content);
            expect(result.valid).toBe(true);
        });

    });

    describe('Edge Cases', () => {
        it('should handle special characters in strings', () => {
            const validator = new LeanValidator();
            const result = validator.validate('message: "Hello, World!"');
            expect(result.valid).toBe(true);
        });

        it('should handle numbers', () => {
            const validator = new LeanValidator();
            const result = validator.validate('count: 42\nprice: 19.99\nnegative: -5');
            expect(result.valid).toBe(true);
        });

        it('should handle booleans', () => {
            const validator = new LeanValidator();
            const result = validator.validate('enabled: true\ndisabled: false');
            expect(result.valid).toBe(true);
        });

        it('should handle null values', () => {
            const validator = new LeanValidator();
            const result = validator.validate('value: null');
            expect(result.valid).toBe(true);
        });

        it('should handle empty values', () => {
            const validator = new LeanValidator();
            const result = validator.validate('empty:');
            expect(result.valid).toBe(true);
        });
    });
});
