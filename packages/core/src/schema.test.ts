import { describe, it, expect } from 'vitest';
import { generateSchema, SchemaValidator, validateSchema } from './schema.js';

describe('LEAN Schema Generation', () => {
  it('generates schema from simple object', () => {
    const schema = generateSchema({ name: 'Alice', age: 30 });
    expect(schema.type).toBe('object');
    expect(schema.properties!.name.type).toBe('string');
    expect(schema.properties!.age.type).toBe('number');
  });

  it('generates schema from nested object', () => {
    const schema = generateSchema({
      user: {
        name: 'Alice',
        scores: [95, 87, 92],
      },
    });
    expect(schema.properties!.user.type).toBe('object');
    expect(schema.properties!.user.properties!.name.type).toBe('string');
    expect(schema.properties!.user.properties!.scores.type).toBe('array');
  });

  it('generates schema with array', () => {
    const schema = generateSchema({ tags: ['a', 'b', 'c'] });
    expect(schema.properties!.tags.type).toBe('array');
    expect(schema.properties!.tags.items!.type).toBe('string');
  });

  it('generates schema for all primitive types', () => {
    const schema = generateSchema({
      str: 'hello',
      num: 42,
      bool: true,
      nil: null,
    });
    expect(schema.properties!.str.type).toBe('string');
    expect(schema.properties!.num.type).toBe('number');
    expect(schema.properties!.bool.type).toBe('boolean');
    expect(schema.properties!.nil.type).toBe('null');
  });
});

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('Schema Validation', () => {
  it('validates data matching schema', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
        age: { type: 'number' as const },
      },
      required: ['name'],
    };
    const result = validateSchema({ name: 'Alice', age: 30 }, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing required field', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
      },
      required: ['name'],
    };
    const result = validateSchema({ age: 30 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('collects multiple errors (does not early-return)', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
        age: { type: 'number' as const },
        email: { type: 'string' as const },
      },
      required: ['name', 'age', 'email'],
    };
    const result = validateSchema({}, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3); // All 3 missing required fields reported
  });

  it('rejects type mismatch', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        age: { type: 'number' as const },
      },
    };
    const result = validateSchema({ age: 'thirty' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects additional properties when not allowed', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
      },
      additionalProperties: false,
    };
    const result = validateSchema({ name: 'Alice', age: 30 }, schema);
    expect(result.valid).toBe(false);
  });

  it('validates enum constraint', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        role: { enum: ['admin', 'user', 'guest'] },
      },
    };
    expect(validateSchema({ role: 'admin' }, schema).valid).toBe(true);
    expect(validateSchema({ role: 'superadmin' }, schema).valid).toBe(false);
  });

  it('validates number constraints', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        age: { type: 'number' as const, minimum: 0, maximum: 150 },
      },
    };
    expect(validateSchema({ age: 30 }, schema).valid).toBe(true);
    expect(validateSchema({ age: -1 }, schema).valid).toBe(false);
    expect(validateSchema({ age: 200 }, schema).valid).toBe(false);
  });

  it('validates string constraints', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        code: { type: 'string' as const, minLength: 2, maxLength: 10, pattern: '^[A-Z]+$' },
      },
    };
    expect(validateSchema({ code: 'ABC' }, schema).valid).toBe(true);
    expect(validateSchema({ code: 'A' }, schema).valid).toBe(false);
    expect(validateSchema({ code: 'TOO_LONG_CODE' }, schema).valid).toBe(false);
    expect(validateSchema({ code: 'abc' }, schema).valid).toBe(false);
  });

  it('validates array constraints', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        items: { type: 'array' as const, items: { type: 'number' as const }, minItems: 1, maxItems: 5 },
      },
    };
    expect(validateSchema({ items: [1, 2] }, schema).valid).toBe(true);
    expect(validateSchema({ items: [] }, schema).valid).toBe(false);
  });
});
