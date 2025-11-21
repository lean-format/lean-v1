import { describe, it, expect } from '@jest/globals';
import { LeanParser } from '../src/parser.js';

describe('Parser Error Paths', () => {
    describe('Invalid Syntax Errors', () => {
        it('should throw on list item at root level', () => {
            const parser = new LeanParser();
            expect(() => {
                parser.parse('- invalid');
            }).toThrow(/Unexpected list item/);
        });
    });

    describe('Deep Merge Edge Cases', () => {
        it('should handle merging non-object into existing object', () => {
            const parser = new LeanParser();
            // This triggers the else branch in mergeIntoResult
            const result = parser.parse('user: Alice\nuser.age: 30');
            expect(result.user).toEqual({ age: 30 });
        });

        it('should handle deep nested merging', () => {
            const parser = new LeanParser();
            const result = parser.parse('a.b.c: 1\na.b.d: 2\na.e: 3');
            expect(result.a.b).toEqual({ c: 1, d: 2 });
            expect(result.a.e).toBe(3);
        });

        it('should merge multiple dot paths correctly', () => {
            const parser = new LeanParser();
            const result = parser.parse('config.db.host: localhost\nconfig.db.port: 5432\nconfig.cache.enabled: true');
            expect(result.config.db).toEqual({ host: 'localhost', port: 5432 });
            expect(result.config.cache.enabled).toBe(true);
        });
    });

    describe('Row Syntax Error Handling', () => {
        it('should handle row with too few columns', () => {
            const parser = new LeanParser();
            const result = parser.parse('users(id, name, age):\n  - 1, Alice');
            // Should still parse, leaving age as null or undefined
            expect(result.users[0].id).toBe(1);
            expect(result.users[0].name).toBe('Alice');
        });

        it('should handle row with too many columns', () => {
            const parser = new LeanParser();
            const result = parser.parse('users(id, name):\n  - 1, Alice, 30, extra');
            // Should parse available columns
            expect(result.users[0].id).toBe(1);
            expect(result.users[0].name).toBe('Alice');
        });
    });
});
