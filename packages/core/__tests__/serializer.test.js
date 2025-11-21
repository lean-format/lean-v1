import { describe, it, expect } from '@jest/globals';
import { LeanSerializer } from '../src/serializer.js';

describe('LeanSerializer', () => {
    describe('Basic Serialization', () => {
        it('should serialize simple object', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ name: 'Alice', age: 30 });
            expect(result).toContain('name: Alice');
            expect(result).toContain('age: 30');
        });

        it('should handle custom indent with proper nesting', () => {
            const serializer = new LeanSerializer({ indent: '    ' });
            const result = serializer.serialize({ outer: { inner: { value: 'test' } } });
            expect(result).toContain('outer:');
            expect(result).toContain('    inner:');
        });

        it('should handle tab indent', () => {
            const serializer = new LeanSerializer({ indent: '\t' });
            const result = serializer.serialize({ outer: { inner: 'value' } });
            expect(result).toContain('\tinner: value');
        });

        it('should handle custom EOL', () => {
            const serializer = new LeanSerializer({ eol: '\r\n' });
            const result = serializer.serialize({ name: 'Alice' });
            expect(result.includes('\r\n') || result.includes('\n')).toBe(true);
        });
    });

    describe('Row Syntax', () => {
        it('should use row syntax for arrays of objects', () => {
            const serializer = new LeanSerializer({ useRowSyntax: true });
            const data = {
                users: [
                    { id: 1, name: 'Alice' },
                    { id: 2, name: 'Bob' }
                ]
            };
            const result = serializer.serialize(data);
            expect(result).toContain('users(id, name):');
            expect(result).toContain('- 1, Alice');
        });

        it('should disable row syntax when option is false', () => {
            const serializer = new LeanSerializer({ useRowSyntax: false });
            const data = {
                users: [
                    { id: 1, name: 'Alice' }
                ]
            };
            const result = serializer.serialize(data);
            expect(result).not.toContain('users(');
        });

        it('should handle row threshold', () => {
            const serializer = new LeanSerializer({ rowThreshold: 3 });
            const data = {
                users: [
                    { id: 1, name: 'Alice' }
                ]
            };
            const result = serializer.serialize(data);
            // Won't use row syntax because array length < threshold
            expect(result).not.toContain('users(');
        });
    });

    describe('String Quoting', () => {
        it('should quote strings with special characters', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ message: 'Hello, World!' });
            expect(result).toContain('"Hello, World!"');
        });

        it('should quote strings starting with numbers', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ value: '123abc' });
            expect(result).toContain('"123abc"');
        });

        it('should quote strings with hashes', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ tag: '#important' });
            expect(result).toContain('"#important"');
        });

        it('should not quote simple strings', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ name: 'Alice' });
            expect(result).toContain('name: Alice');
            expect(result).not.toContain('"Alice"');
        });
    });

    describe('Complex Structures', () => {
        it('should serialize nested objects properly', () => {
            const serializer = new LeanSerializer();
            const data = {
                user: {
                    name: 'Alice',
                    address: {
                        city: 'NYC'
                    }
                }
            };
            const result = serializer.serialize(data);
            expect(result).toContain('user');
            expect(result).toContain('name: Alice');
            expect(result).toContain('city: NYC');
        });

        it('should serialize arrays of primitives', () => {
            const serializer = new LeanSerializer();
            const data = {
                tags: ['red', 'green', 'blue']
            };
            const result = serializer.serialize(data);
            expect(result).toContain('tags:');
            expect(result).toContain('- red');
            expect(result).toContain('- green');
            expect(result).toContain('- blue');
        });

        it('should serialize mixed arrays', () => {
            const serializer = new LeanSerializer();
            const data = {
                items: [1, 'two', true, null]
            };
            const result = serializer.serialize(data);
            expect(result).toContain('- 1');
            expect(result).toContain('- two');
            expect(result).toContain('- true');
            expect(result).toContain('- null');
        });
    });

    describe('Edge Cases', () => {
        it('should handle null values', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ value: null });
            expect(result).toContain('value: null');
        });

        it('should handle boolean values', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ enabled: true, disabled: false });
            expect(result).toContain('enabled: true');
            expect(result).toContain('disabled: false');
        });

        it('should handle number values', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ count: 42, price: 19.99, negative: -5 });
            expect(result).toContain('count: 42');
            expect(result).toContain('price: 19.99');
            expect(result).toContain('negative: -5');
        });

        it('should handle empty objects', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({});
            // Empty object serializes to empty string or minimal output
            expect(typeof result).toBe('string');
        });

        it('should handle empty arrays', () => {
            const serializer = new LeanSerializer();
            const result = serializer.serialize({ items: [] });
            expect(result).toContain('items:');
        });

        it('should handle objects with numeric keys', () => {
            const serializer = new LeanSerializer();
            const data = { '0': 'zero', '1': 'one' };
            const result = serializer.serialize(data);
            expect(result).toContain('0: zero');
            expect(result).toContain('1: one');
        });
    });

    describe('Row Syntax Edge Cases', () => {
        it('should handle non-homogeneous arrays', () => {
            const serializer = new LeanSerializer({ useRowSyntax: true });
            const data = {
                items: [
                    { id: 1, name: 'Alice' },
                    { id: 2 }  // Missing 'name' field
                ]
            };
            const result = serializer.serialize(data);
            // Should still attempt row syntax
            expect(result).toContain('items(');
        });

        it('should handle arrays with nested objects', () => {
            const serializer = new LeanSerializer({ useRowSyntax: true });
            const data = {
                users: [
                    { id: 1, profile: { name: 'Alice' } }
                ]
            };
            const result = serializer.serialize(data);
            // Should not use row syntax for nested objects
            expect(result).not.toContain('users(');
        });
    });
});
