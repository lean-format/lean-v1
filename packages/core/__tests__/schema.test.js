import { describe, it, expect } from '@jest/globals';
import { validateSchema, SchemaValidator } from '../src/schema.js';

describe('Schema Validation', () => {
    describe('Type Validation', () => {
        it('should validate object type', () => {
            const schema = { type: 'object' };
            const result = validateSchema({ name: 'Alice' }, schema);
            expect(result.valid).toBe(true);
        });

        it('should reject non-object for object type', () => {
            const schema = { type: 'object' };
            const result = validateSchema('not an object', schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('Expected type object');
        });

        it('should validate array type', () => {
            const schema = { type: 'array' };
            const result = validateSchema([1, 2, 3], schema);
            expect(result.valid).toBe(true);
        });

        it('should validate string type', () => {
            const schema = { type: 'string' };
            const result = validateSchema('hello', schema);
            expect(result.valid).toBe(true);
        });

        it('should validate number type', () => {
            const schema = { type: 'number' };
            const result = validateSchema(42, schema);
            expect(result.valid).toBe(true);
        });

        it('should validate boolean type', () => {
            const schema = { type: 'boolean' };
            const result = validateSchema(true, schema);
            expect(result.valid).toBe(true);
        });

        it('should validate null type', () => {
            const schema = { type: 'null' };
            const result = validateSchema(null, schema);
            expect(result.valid).toBe(true);
        });
    });

    describe('Object Properties', () => {
        it('should validate object properties', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' }
                }
            };
            const result = validateSchema({ name: 'Alice', age: 30 }, schema);
            expect(result.valid).toBe(true);
        });

        it('should detect invalid property types', () => {
            const schema = {
                type: 'object',
                properties: {
                    age: { type: 'number' }
                }
            };
            const result = validateSchema({ age: 'not-a-number' }, schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].path).toBe('root.age');
        });

        it('should validate required fields', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                },
                required: ['name']
            };
            const result = validateSchema({}, schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('Missing required field: name');
        });

        it('should allow missing optional fields', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' }
                },
                required: ['name']
            };
            const result = validateSchema({ name: 'Alice' }, schema);
            expect(result.valid).toBe(true);
        });

        it('should reject additional properties when disallowed', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                },
                additionalProperties: false
            };
            const result = validateSchema({ name: 'Alice', age: 30 }, schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('Additional property not allowed: age');
        });

        it('should allow additional properties by default', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };
            const result = validateSchema({ name: 'Alice', age: 30 }, schema);
            expect(result.valid).toBe(true);
        });
    });

    describe('Array Validation', () => {
        it('should validate array items', () => {
            const schema = {
                type: 'array',
                items: { type: 'number' }
            };
            const result = validateSchema([1, 2, 3], schema);
            expect(result.valid).toBe(true);
        });

        it('should detect invalid array items', () => {
            const schema = {
                type: 'array',
                items: { type: 'number' }
            };
            const result = validateSchema([1, 'two', 3], schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].path).toBe('root[1]');
        });

        it('should validate minItems', () => {
            const schema = {
                type: 'array',
                items: { type: 'number' },
                minItems: 2
            };
            const result = validateSchema([1], schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('at least 2 items');
        });

        it('should validate maxItems', () => {
            const schema = {
                type: 'array',
                items: { type: 'number' },
                maxItems: 2
            };
            const result = validateSchema([1, 2, 3], schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('at most 2 items');
        });

        it('should reject non-array for array type', () => {
            const schema = {
                type: 'array',
                items: { type: 'string' }
            };
            const result = validateSchema('not-an-array', schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('Expected type array');
        });
    });

    describe('Enum Validation', () => {
        it('should validate enum values', () => {
            const schema = {
                type: 'string',
                enum: ['red', 'green', 'blue']
            };
            const result = validateSchema('red', schema);
            expect(result.valid).toBe(true);
        });

        it('should reject invalid enum values', () => {
            const schema = {
                type: 'string',
                enum: ['red', 'green', 'blue']
            };
            const result = validateSchema('yellow', schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('must be one of');
        });
    });

    describe('Number Constraints', () => {
        it('should validate minimum', () => {
            const schema = {
                type: 'number',
                minimum: 0
            };
            const result = validateSchema(-1, schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('must be >= 0');
        });

        it('should validate maximum', () => {
            const schema = {
                type: 'number',
                maximum: 100
            };
            const result = validateSchema(101, schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('must be <= 100');
        });

        it('should allow valid range', () => {
            const schema = {
                type: 'number',
                minimum: 0,
                maximum: 100
            };
            const result = validateSchema(50, schema);
            expect(result.valid).toBe(true);
        });
    });

    describe('String Constraints', () => {
        it('should validate minLength', () => {
            const schema = {
                type: 'string',
                minLength: 3
            };
            const result = validateSchema('ab', schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('at least 3 characters');
        });

        it('should validate maxLength', () => {
            const schema = {
                type: 'string',
                maxLength: 5
            };
            const result = validateSchema('toolong', schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('at most 5 characters');
        });

        it('should validate pattern', () => {
            const schema = {
                type: 'string',
                pattern: '^[a-z]+$'
            };
            const result = validateSchema('ABC', schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].message).toContain('must match pattern');
        });

        it('should allow valid pattern', () => {
            const schema = {
                type: 'string',
                pattern: '^[a-z]+$'
            };
            const result = validateSchema('abc', schema);
            expect(result.valid).toBe(true);
        });
    });

    describe('Nested Objects', () => {
        it('should validate nested object structures', () => {
            const schema = {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            age: { type: 'number' }
                        },
                        required: ['name']
                    }
                }
            };
            const result = validateSchema({
                user: { name: 'Alice', age: 30 }
            }, schema);
            expect(result.valid).toBe(true);
        });

        it('should detect errors in nested objects', () => {
            const schema = {
                type: 'object',
                properties: {
                    user: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        },
                        required: ['name']
                    }
                }
            };
            const result = validateSchema({ user: {} }, schema);
            expect(result.valid).toBe(false);
            expect(result.errors[0].path).toBe('root.user');
        });
    });

    describe('SchemaValidator Class', () => {
        it('should work with class instance', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                },
                required: ['name']
            };
            const validator = new SchemaValidator(schema);
            const isValid = validator.validate({ name: 'Alice' });
            expect(isValid).toBe(true);
            expect(validator.getErrors()).toHaveLength(0);
        });

        it('should accumulate errors in class instance', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                },
                required: ['name']
            };
            const validator = new SchemaValidator(schema);
            const isValid = validator.validate({});
            expect(isValid).toBe(false);
            expect(validator.getErrors()).toHaveLength(1);
            expect(validator.getErrors()[0].message).toContain('Missing required field');
        });

        it('should allow overriding schema in validate', () => {
            const defaultSchema = { type: 'string' };
            const validator = new SchemaValidator(defaultSchema);

            const customSchema = { type: 'number' };
            const isValid = validator.validate(42, customSchema);
            expect(isValid).toBe(true);
        });
    });

    describe('Complex Schemas', () => {
        it('should validate complex user schema', () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'number', minimum: 1 },
                    name: { type: 'string', minLength: 1 },
                    email: { type: 'string', pattern: '^.+@.+\\..+$' },
                    age: { type: 'number', minimum: 0, maximum: 150 },
                    roles: {
                        type: 'array',
                        items: { type: 'string', enum: ['admin', 'user', 'guest'] },
                        minItems: 1
                    }
                },
                required: ['id', 'name', 'email'],
                additionalProperties: false
            };

            const validUser = {
                id: 1,
                name: 'Alice',
                email: 'alice@example.com',
                age: 30,
                roles: ['admin', 'user']
            };

            const result = validateSchema(validUser, schema);
            expect(result.valid).toBe(true);
        });

        it('should detect multiple validation errors', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' }
                },
                required: ['name', 'age']
            };

            const result = validateSchema({}, schema);
            expect(result.valid).toBe(false);
            // Should fail on first required field
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
