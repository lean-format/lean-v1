import { describe, it, expect } from 'vitest';
import { generateSchema } from './schema.js';

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
