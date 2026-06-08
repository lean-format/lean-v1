import type { LeanSchema, SchemaValidationError, SchemaValidationResult } from './types.js';

/**
 * Validate data against a LEAN schema definition.
 */
export class SchemaValidator {
  private schema: LeanSchema;
  private errors: SchemaValidationError[];

  constructor(schema: LeanSchema) {
    this.schema = schema;
    this.errors = [];
  }

  /**
   * Validate data against schema.
   * @param data - Data to validate
   * @param schema - Schema to validate against (defaults to constructor schema)
   * @param path - Current path in data (for error messages)
   * @returns true if valid
   */
  validate(data: unknown, schema?: LeanSchema, path = 'root'): boolean {
    this.errors = [];
    return this.validateValue(data, schema ?? this.schema, path);
  }

  /**
   * Get validation errors from the last validate call.
   */
  getErrors(): SchemaValidationError[] {
    return this.errors;
  }

  private validateValue(value: unknown, schema: LeanSchema, path: string): boolean {
    if (schema.type && schema.type !== 'any') {
      if (!this.checkType(value, schema.type, path)) {
        return false;
      }
    }

    // Object properties
    if (schema.type === 'object' && schema.properties && typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;

      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in obj)) {
            this.errors.push({ path, message: `Missing required field: '${field}'` });
            return false;
          }
        }
      }

      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          if (!this.validateValue(obj[key], propSchema, `${path}.${key}`)) {
            return false;
          }
        }
      }

      if (schema.additionalProperties === false) {
        const allowedKeys = new Set(Object.keys(schema.properties));
        for (const key of Object.keys(obj)) {
          if (!allowedKeys.has(key)) {
            this.errors.push({ path, message: `Additional property not allowed: '${key}'` });
            return false;
          }
        }
      }
    }

    // Array items
    if (schema.type === 'array' && schema.items) {
      if (!Array.isArray(value)) {
        this.errors.push({ path, message: `Expected array, got ${typeof value}` });
        return false;
      }

      for (let i = 0; i < value.length; i++) {
        if (!this.validateValue(value[i], schema.items, `${path}[${i}]`)) {
          return false;
        }
      }

      if (schema.minItems !== undefined && value.length < schema.minItems) {
        this.errors.push({ path, message: `Array must have at least ${schema.minItems} items, got ${value.length}` });
        return false;
      }

      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        this.errors.push({ path, message: `Array must have at most ${schema.maxItems} items, got ${value.length}` });
        return false;
      }
    }

    // Enum
    if (schema.enum !== undefined && !schema.enum.includes(value)) {
      this.errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}. Got: ${JSON.stringify(value)}` });
      return false;
    }

    // Number constraints
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        this.errors.push({ path, message: `Value must be >= ${schema.minimum}, got ${value}` });
        return false;
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        this.errors.push({ path, message: `Value must be <= ${schema.maximum}, got ${value}` });
        return false;
      }
    }

    // String constraints
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        this.errors.push({ path, message: `String must be at least ${schema.minLength} characters, got ${value.length}` });
        return false;
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        this.errors.push({ path, message: `String must be at most ${schema.maxLength} characters, got ${value.length}` });
        return false;
      }
      if (schema.pattern) {
        try {
          const regex = new RegExp(schema.pattern);
          if (!regex.test(value)) {
            this.errors.push({ path, message: `String must match pattern: ${schema.pattern}` });
            return false;
          }
        } catch {
          this.errors.push({ path, message: `Invalid regex pattern: ${schema.pattern}` });
          return false;
        }
      }
    }

    return true;
  }

  private checkType(value: unknown, expectedType: string, path: string): boolean {
    const actualType = this.getType(value);
    if (actualType !== expectedType) {
      this.errors.push({ path, message: `Expected type '${expectedType}', got '${actualType}'` });
      return false;
    }
    return true;
  }

  private getType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }
}

/**
 * Validate data against a schema.
 *
 * @param data - Data to validate
 * @param schema - Validation schema
 * @returns Validation result with errors if invalid
 */
export function validateSchema(data: unknown, schema: LeanSchema): SchemaValidationResult {
  const validator = new SchemaValidator(schema);
  const valid = validator.validate(data);
  return {
    valid,
    errors: valid ? [] : validator.getErrors(),
  };
}

/**
 * Generate a schema from sample data.
 * Useful for creating schemas from example LEAN files.
 *
 * @param data - Sample data to analyze
 * @returns Inferred schema
 */
export function generateSchema(data: unknown): LeanSchema {
  if (data === null) return { type: 'null' };

  if (typeof data === 'string') {
    return { type: 'string' };
  }

  if (typeof data === 'number') {
    return { type: 'number' };
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return { type: 'array' };
    const itemSchemas = data.map((item) => generateSchema(item));

    // If all items have the same schema type, use that
    const firstType = itemSchemas[0].type;
    const isUniform = itemSchemas.every((s) => s.type === firstType);

    if (isUniform && firstType === 'object') {
      // Merge property schemas
      const mergedProps: Record<string, LeanSchema> = {};
      const required: string[] = [];
      for (const item of data) {
        if (typeof item === 'object' && item !== null) {
          for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
            if (!mergedProps[key]) {
              mergedProps[key] = generateSchema(val);
            }
          }
        }
      }
      // Fields present in all items are required
      if (data.length > 0) {
        const allKeys = Object.keys(mergedProps);
        for (const key of allKeys) {
          if (data.every((item) => typeof item === 'object' && item !== null && key in (item as Record<string, unknown>))) {
            required.push(key);
          }
        }
      }
      return {
        type: 'array',
        items: {
          type: 'object',
          properties: mergedProps,
          ...(required.length > 0 ? { required } : {}),
        },
      };
    }

    return {
      type: 'array',
      items: itemSchemas[0],
    };
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const properties: Record<string, LeanSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      properties[key] = generateSchema(value);
      required.push(key);
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  return { type: 'any' };
}
