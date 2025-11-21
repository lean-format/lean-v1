/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
 */

// ============================================================================
// Options Interfaces
// ============================================================================

export interface LeanParserOptions {
    /**
     * Enable strict mode validation
     * @default false
     */
    strict?: boolean;

    /**
     * Enable row syntax parsing
     * @default true
     */
    useRowSyntax?: boolean;
}

export interface LeanSerializerOptions {
    /**
     * Indentation string (e.g., '  ', '\t')
     * @default '  '
     */
    indent?: string;

    /**
     * End-of-line character
     * @default '\n'
     */
    eol?: string;

    /**
     * Enable row syntax optimization
     * @default true
     */
    useRowSyntax?: boolean;

    /**
     * Minimum number of items to use row syntax
     * @default 2
     */
    rowThreshold?: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
    /**
     * Line number where error occurred (1-indexed)
     */
    line?: number;

    /**
     * Error message
     */
    message: string;
}

export interface ValidationResult {
    /**
     * Whether the input is valid
     */
    valid: boolean;

    /**
     * Array of validation errors (empty if valid)
     */
    errors: ValidationError[];
}

// ============================================================================
// Token Types
// ============================================================================

export enum TokenType {
    INDENT = 'INDENT',
    DEDENT = 'DEDENT',
    NEWLINE = 'NEWLINE',
    IDENTIFIER = 'IDENTIFIER',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    COLON = 'COLON',
    HYPHEN = 'HYPHEN',
    COMMA = 'COMMA',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    EOF = 'EOF'
}

export class Token {
    type: TokenType;
    value: any;
    line: number;
    column: number;

    constructor(type: TokenType, value: any, line: number, column: number);
}

// ============================================================================
// Main API Functions
// ============================================================================

/**
 * Parse LEAN format text into JavaScript object
 * @param input - LEAN format text
 * @param options - Parser configuration options
 * @returns Parsed JavaScript object
 */
export function parse(input: string, options?: LeanParserOptions): any;

/**
 * Format JavaScript object as LEAN text
 * @param obj - JavaScript object to format
 * @param options - Serializer configuration options
 * @returns LEAN format text
 */
export function format(obj: any, options?: LeanSerializerOptions): string;

/**
 * Validate LEAN format text
 * @param input - LEAN format text to validate
 * @param options - Validation options
 * @returns Validation result with errors if invalid
 */
export function validate(input: string, options?: LeanParserOptions): ValidationResult;

// ============================================================================
// Classes
// ============================================================================

/**
 * LEAN Parser class for converting LEAN text to JavaScript objects
 */
export class LeanParser {
    /**
     * Create a new parser instance
     * @param options - Parser configuration options
     */
    constructor(options?: LeanParserOptions);

    /**
     * Parse LEAN format text
     * @param input - LEAN format text
     * @returns Parsed JavaScript object
     */
    parse(input: string): any;
}

/**
 * LEAN Serializer class for converting JavaScript objects to LEAN text
 */
export class LeanSerializer {
    /**
     * Create a new serializer instance
     * @param options - Serializer configuration options
     */
    constructor(options?: LeanSerializerOptions);

    /**
     * Serialize JavaScript object to LEAN format
     * @param obj - JavaScript object
     * @returns LEAN format text
     */
    serialize(obj: any): string;
}

/**
 * LEAN Validator class for validating LEAN format text
 */
export class LeanValidator {
    /**
     * Create a new validator instance
     * @param options - Validation options
     */
    constructor(options?: LeanParserOptions);

    /**
     * Validate LEAN format text
     * @param input - LEAN format text
     * @returns Validation result
     */
    validate(input: string): ValidationResult;
}

/**
 * Lexer class for tokenizing LEAN format text
 */
export class Lexer {
    /**
     * Create a new lexer instance
     * @param input - LEAN format text to tokenize
     */
    constructor(input: string);

    /**
     * Tokenize the input text
     * @returns Array of tokens
     */
    tokenize(): Token[];
}

// ============================================================================
// Schema Validation
// ============================================================================

export interface Schema {
    type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    properties?: Record<string, Schema>;
    required?: string[];
    additionalProperties?: boolean;
    items?: Schema;
    minItems?: number;
    maxItems?: number;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
}

export interface SchemaValidationError {
    path: string;
    message: string;
}

export interface SchemaValidationResult {
    valid: boolean;
    errors: SchemaValidationError[];
}

/**
 * Schema validator class for validating data against schemas
 */
export class SchemaValidator {
    /**
     * Create a new schema validator
     * @param schema - Validation schema
     */
    constructor(schema: Schema);

    /**
     * Validate data against schema
     * @param data - Data to validate
     * @param schema - Schema to validate against (optional, uses constructor schema)
     * @param path - Current path in data (for error messages)
     * @returns true if valid
     */
    validate(data: any, schema?: Schema, path?: string): boolean;

    /**
     * Get validation errors
     * @returns Array of validation errors
     */
    getErrors(): SchemaValidationError[];
}

/**
 * Validate data against schema
 * @param data - Data to validate
 * @param schema - Validation schema
 * @returns Validation result with errors if invalid
 */
export function validateSchema(data: any, schema: Schema): SchemaValidationResult;
