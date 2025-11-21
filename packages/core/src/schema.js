/**
 * Schema validator for LEAN format
 * Provides JSON Schema-like validation for LEAN data structures
 */

class SchemaValidator {
    constructor(schema) {
        this.schema = schema;
        this.errors = [];
    }

    /**
     * Validate data against schema
     * @param {any} data - Data to validate
     * @param {object} schema - Schema to validate against (defaults to constructor schema)
     * @param {string} path - Current path in data (for error messages)
     * @returns {boolean} - true if valid
     */
    validate(data, schema = this.schema, path = 'root') {
        this.errors = [];
        return this._validateValue(data, schema, path);
    }

    _validateValue(value, schema, path) {
        // Check type
        if (schema.type) {
            if (!this._checkType(value, schema.type, path)) {
                return false;
            }
        }

        // Check required fields (for objects)
        if (schema.type === 'object' && schema.properties) {
            if (schema.required) {
                for (const field of schema.required) {
                    if (!(field in value)) {
                        this.errors.push({
                            path,
                            message: `Missing required field: ${field}`
                        });
                        return false;
                    }
                }
            }

            // Validate each property
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in value) {
                    if (!this._validateValue(value[key], propSchema, `${path}.${key}`)) {
                        return false;
                    }
                }
            }

            // Check for additional properties
            if (schema.additionalProperties === false) {
                const allowedKeys = new Set(Object.keys(schema.properties));
                for (const key of Object.keys(value)) {
                    if (!allowedKeys.has(key)) {
                        this.errors.push({
                            path,
                            message: `Additional property not allowed: ${key}`
                        });
                        return false;
                    }
                }
            }
        }

        // Check array items
        if (schema.type === 'array' && schema.items) {
            if (!Array.isArray(value)) {
                this.errors.push({
                    path,
                    message: `Expected array, got ${typeof value}`
                });
                return false;
            }

            for (let i = 0; i < value.length; i++) {
                if (!this._validateValue(value[i], schema.items, `${path}[${i}]`)) {
                    return false;
                }
            }

            // Check min/max items
            if (schema.minItems !== undefined && value.length < schema.minItems) {
                this.errors.push({
                    path,
                    message: `Array must have at least ${schema.minItems} items, got ${value.length}`
                });
                return false;
            }

            if (schema.maxItems !== undefined && value.length > schema.maxItems) {
                this.errors.push({
                    path,
                    message: `Array must have at most ${schema.maxItems} items, got ${value.length}`
                });
                return false;
            }
        }

        // Check enum
        if (schema.enum) {
            if (!schema.enum.includes(value)) {
                this.errors.push({
                    path,
                    message: `Value must be one of: ${schema.enum.join(', ')}. Got: ${value}`
                });
                return false;
            }
        }

        // Check number constraints
        if (typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                this.errors.push({
                    path,
                    message: `Value must be >= ${schema.minimum}, got ${value}`
                });
                return false;
            }

            if (schema.maximum !== undefined && value > schema.maximum) {
                this.errors.push({
                    path,
                    message: `Value must be <= ${schema.maximum}, got ${value}`
                });
                return false;
            }
        }

        // Check string constraints
        if (typeof value === 'string') {
            if (schema.minLength !== undefined && value.length < schema.minLength) {
                this.errors.push({
                    path,
                    message: `String must be at least ${schema.minLength} characters, got ${value.length}`
                });
                return false;
            }

            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                this.errors.push({
                    path,
                    message: `String must be at most ${schema.maxLength} characters, got ${value.length}`
                });
                return false;
            }

            if (schema.pattern) {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(value)) {
                    this.errors.push({
                        path,
                        message: `String must match pattern: ${schema.pattern}`
                    });
                    return false;
                }
            }
        }

        return true;
    }

    _checkType(value, expectedType, path) {
        const actualType = this._getType(value);

        if (actualType !== expectedType) {
            this.errors.push({
                path,
                message: `Expected type ${expectedType}, got ${actualType}`
            });
            return false;
        }

        return true;
    }

    _getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'object') return 'object';
        return 'unknown';
    }

    getErrors() {
        return this.errors;
    }
}

/**
 * Validate data against schema
 * @param {any} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - { valid: boolean, errors: array }
 */
export function validateSchema(data, schema) {
    const validator = new SchemaValidator(schema);
    const valid = validator.validate(data);

    return {
        valid,
        errors: validator.getErrors()
    };
}

export { SchemaValidator };
