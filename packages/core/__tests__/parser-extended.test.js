import { describe, it, expect } from '@jest/globals';
import { LeanParser } from '../src/parser.js';

describe('LeanParser Additional Coverage', () => {
    describe('Edge Cases', () => {
        it('should handle empty input', () => {
            const parser = new LeanParser();
            const result = parser.parse('');
            expect(result).toEqual({});
        });

        it('should handle whitespace-only input', () => {
            const parser = new LeanParser();
            const result = parser.parse('   \n  \n  ');
            expect(result).toEqual({});
        });

        it('should handle comment-only input', () => {
            const parser = new LeanParser();
            const result = parser.parse('# Just a comment\n# Another comment');
            expect(result).toEqual({});
        });

        it('should parse empty values', () => {
            const parser = new LeanParser();
            const result = parser.parse('empty:');
            expect(result).toEqual({ empty: null });
        });
    });

    describe('Row Syntax Edge Cases', () => {
        it('should handle row syntax with single column', () => {
            const parser = new LeanParser();
            const result = parser.parse('items(name):\n  - Alice\n  - Bob');
            expect(result.items).toHaveLength(2);
            expect(result.items[0]).toEqual({ name: 'Alice' });
        });

        it('should handle row syntax with empty cells', () => {
            const parser = new LeanParser();
            const result = parser.parse('users(id, name):\n  - 1,\n  - 2, Bob');
            expect(result.users[0]).toEqual({ id: 1, name: null });
            expect(result.users[1]).toEqual({ id: 2, name: 'Bob' });
        });

        it('should handle row syntax with quoted values', () => {
            const parser = new LeanParser();
            const result = parser.parse('data(id, message):\n  - 1, "Hello, World!"\n  - 2, "Test"');
            expect(result.data[0].message).toBe('Hello, World!');
        });
    });

    describe('Dot Notation', () => {
        it('should handle dot notation keys', () => {
            const parser = new LeanParser();
            const result = parser.parse('user.name: Alice\nuser.age: 30');
            expect(result).toEqual({
                user: {
                    name: 'Alice',
                    age: 30
                }
            });
        });

        it('should handle deep dot notation', () => {
            const parser = new LeanParser();
            const result = parser.parse('app.config.database.host: localhost');
            expect(result).toEqual({
                app: {
                    config: {
                        database: {
                            host: 'localhost'
                        }
                    }
                }
            });
        });

        it('should merge dot notation with nested objects', () => {
            const parser = new LeanParser();
            const result = parser.parse('user.name: Alice\nuser:\n  age: 30');
            expect(result.user).toEqual({
                name: 'Alice',
                age: 30
            });
        });
    });

    describe('Type Parsing', () => {
        it('should parse boolean true/false', () => {
            const parser = new LeanParser();
            const result = parser.parse('a: true\nb: false');
            expect(result.a).toBe(true);
            expect(result.b).toBe(false);
        });

        it('should parse null', () => {
            const parser = new LeanParser();
            const result = parser.parse('a: null');
            expect(result.a).toBe(null);
        });

        it('should parse negative numbers', () => {
            const parser = new LeanParser();
            const result = parser.parse('neg: -42\nfloat: -3.14');
            expect(result.neg).toBe(-42);
            expect(result.float).toBe(-3.14);
        });

        it('should parse decimal numbers', () => {
            const parser = new LeanParser();
            const result = parser.parse('price: 19.99\nratio: 0.5');
            expect(result.price).toBe(19.99);
            expect(result.ratio).toBe(0.5);
        });
    });

    describe('List Variations', () => {
        it('should parse nested lists', () => {
            const parser = new LeanParser();
            const result = parser.parse('matrix:\n  - \n    - 1\n    - 2\n  - \n    - 3\n    - 4');
            expect(result.matrix).toEqual([[1, 2], [3, 4]]);
        });

        it('should parse lists with mixed types', () => {
            const parser = new LeanParser();
            const result = parser.parse('items:\n  - 1\n  - "text"\n  - true\n  - null');
            expect(result.items).toEqual([1, 'text', true, null]);
        });

        it('should parse lists of objects', () => {
            const parser = new LeanParser();
            const result = parser.parse('users:\n  - \n    name: Alice\n  - \n    name: Bob');
            expect(result.users).toHaveLength(2);
            expect(result.users[0].name).toBe('Alice');
        });
    });

    describe('String Parsing', () => {
        it('should preserve quoted strings', () => {
            const parser = new LeanParser();
            const result = parser.parse('message: "Hello, World!"\nquoted: "123"');
            expect(result.message).toBe('Hello, World!');
            expect(result.quoted).toBe('123');
        });

        it('should handle simple unquoted strings', () => {
            const parser = new LeanParser();
            const result = parser.parse('name: Alice\nstatus: active');
            expect(result.name).toBe('Alice');
            expect(result.status).toBe('active');
        });
    });

    describe('Strict Mode', () => {
        it('should work in strict mode', () => {
            const parser = new LeanParser({ strict: true });
            const result = parser.parse('name: Alice\nage: 30');
            expect(result).toEqual({ name: 'Alice', age: 30 });
        });

        it('should handle errors in strict mode', () => {
            const parser = new LeanParser({ strict: true });
            expect(() => {
                parser.parse('invalid :: syntax');
            }).toThrow();
        });
    });

    describe('Complex Real-World Examples', () => {
        it('should parse configuration file', () => {
            const parser = new LeanParser();
            const config = `app:
  name: "My App"
  version: 1.0
  debug: false
database:
  host: localhost
  port: 5432
  credentials:
    user: admin
    password: "secret123"
features:
  - auth
  - api
  - cache`;
            const result = parser.parse(config);
            expect(result.app.name).toBe('My App');
            expect(result.database.port).toBe(5432);
            expect(result.features).toHaveLength(3);
        });

        it('should parse data with row syntax', () => {
            const parser = new LeanParser();
            const data = `project: "My Project"
users(id, name, active):
  - 1, Alice, true
  - 2, Bob, false
  - 3, Casey, true`;
            const result = parser.parse(data);
            expect(result.project).toBe('My Project');
            expect(result.users).toHaveLength(3);
            expect(result.users[1].active).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should throw meaningful error for invalid row syntax', () => {
            const parser = new LeanParser();
            expect(() => {
                parser.parse('users(id, name\n  - 1, Alice'); // Missing closing paren
            }).toThrow();
        });

        it('should handle unexpected dedent gracefully', () => {
            const parser = new LeanParser({ strict: false });
            // This should not throw in non-strict mode
            const result = parser.parse('name: Alice');
            expect(result.name).toBe('Alice');
        });
    });

    describe('Additional Edge Cases', () => {
        it('should handle objects with many nested levels', () => {
            const parser = new LeanParser();
            const data = `level1:
  level2:
    level3:
      level4:
        value: deep`;
            const result = parser.parse(data);
            expect(result.level1.level2.level3.level4.value).toBe('deep');
        });

        it('should parse objects in lists', () => {
            const parser = new LeanParser();
            const data = `items:
  -
    id: 1
    name: first
  -
    id: 2
    name: second`;
            const result = parser.parse(data);
            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe(1);
        });

        it('should handle row syntax with multiple rows', () => {
            const parser = new LeanParser();
            const data = `data(a, b, c):
  - 1, 2, 3
  - 4, 5, 6
  - 7, 8, 9`;
            const result = parser.parse(data);
            expect(result.data).toHaveLength(3);
            expect(result.data[2].c).toBe(9);
        });

        it('should handle mixed content appropriately', () => {
            const parser = new LeanParser();
            const data = `simple: value
nested:
  inner: data
list:
  - item1
  - item2`;
            const result = parser.parse(data);
            expect(result.simple).toBe('value');
            expect(result.nested.inner).toBe('data');
            expect(result.list).toHaveLength(2);
        });
    });
});
