import type { LeanSchema, SchemaValidationError, SchemaValidationResult } from './types.js';
/**
 * Validate data against a LEAN schema definition.
 */
export declare class SchemaValidator {
    private schema;
    private errors;
    constructor(schema: LeanSchema);
    /**
     * Validate data against schema.
     * @param data - Data to validate
     * @param schema - Schema to validate against (defaults to constructor schema)
     * @param path - Current path in data (for error messages)
     * @returns true if valid
     */
    validate(data: unknown, schema?: LeanSchema, path?: string): boolean;
    /**
     * Get validation errors from the last validate call.
     */
    getErrors(): SchemaValidationError[];
    private validateValue;
    private checkType;
    private getType;
}
/**
 * Validate data against a schema.
 *
 * @param data - Data to validate
 * @param schema - Validation schema
 * @returns Validation result with errors if invalid
 */
export declare function validateSchema(data: unknown, schema: LeanSchema): SchemaValidationResult;
/**
 * Generate a schema from sample data.
 * Useful for creating schemas from example LEAN files.
 *
 * @param data - Sample data to analyze
 * @returns Inferred schema
 */
export declare function generateSchema(data: unknown): LeanSchema;
//# sourceMappingURL=schema.d.ts.map