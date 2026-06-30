import { describe, it, expect } from 'vitest';
import { validate, validateStrict } from './validator.js';

describe('Validator', () => {
  it('validate returns valid for correct input', () => {
    const result = validate('key: value');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validate returns errors for invalid input', () => {
    const result = validate('invalid\n  bad');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validate with strict option', () => {
    const result = validate('key: value', { strict: true });
    expect(result.valid).toBe(true);
  });

  it('validateStrict does not throw for valid input', () => {
    expect(() => validateStrict('key: value')).not.toThrow();
  });

  it('validateStrict throws for invalid input', () => {
    expect(() => validateStrict('invalid\n  bad')).toThrow();
  });
});
