import { parse, format } from '../src/index.js';

describe('Basic LEAN Parser', () => {
  test('should parse simple LEAN string', () => {
    const lean = 'name: John\nage: 30';
    const result = parse(lean);
    expect(result).toEqual({
      name: 'John',
      age: 30
    });
  });

  test('should format simple object to LEAN', () => {
    const obj = { name: 'John', age: 30 };
    const result = format(obj);
    expect(typeof result).toBe('string');
    expect(result).toContain('name: John');
    expect(result).toContain('age: 30');
  });
});
