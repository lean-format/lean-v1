// ============================================================================
// LEAN Format - Type Definitions
// ============================================================================

/** Value types that can be represented in LEAN */
export type LeanValue =
  | string
  | number
  | boolean
  | null
  | LeanValue[]
  | { [key: string]: LeanValue };

/** Options for the parser */
export interface ParseOptions {
  /** Enable strict mode: reject extra row values, duplicate keys */
  strict?: boolean;
}

/** Options for the serializer */
export interface FormatOptions {
  /** Indentation string (default: '  ') */
  indent?: string;
  /** Enable row syntax optimization (default: true) */
  useRowSyntax?: boolean;
  /** Minimum items to use row syntax (default: 4, per spec §9.2) */
  rowThreshold?: number;
  /** Use dot-notation for nested keys (default: false) */
  useDotNotation?: boolean;
  /** Sort keys alphabetically (default: false) */
  sortKeys?: boolean;
}

/** A single validation error */
export interface ValidationError {
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed), if available */
  column?: number;
  /** Error message */
  message: string;
  /** Suggestion for fixing, if available */
  suggestion?: string;
  /** Code snippet showing the error context */
  snippet?: string;
}

/** Result of validation */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Schema for LEAN data validation */
export interface LeanSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'any';
  properties?: Record<string, LeanSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: LeanSchema;
  minItems?: number;
  maxItems?: number;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
}

/** Schema validation error */
export interface SchemaValidationError {
  path: string;
  message: string;
}

/** Schema validation result */
export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

/** A single diff entry between two LEAN documents */
export interface DiffEntry {
  type: 'added' | 'removed' | 'changed';
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Query result with path information */
export interface QueryResult {
  value: unknown;
  path: string;
  exists: boolean;
}

// ============================================================================
// Internal types
// ============================================================================

/** Internal LEAN token types */
export enum TokenType {
  Indent = 'INDENT',
  Dedent = 'DEDENT',
  Newline = 'NEWLINE',
  Identifier = 'IDENTIFIER',
  String = 'STRING',
  Number = 'NUMBER',
  Boolean = 'BOOLEAN',
  Null = 'NULL',
  Colon = 'COLON',
  Hyphen = 'HYPHEN',
  Comma = 'COMMA',
  LParen = 'LPAREN',
  RParen = 'RPAREN',
  LBrace = 'LBRACE',
  RBrace = 'RBRACE',
  LBracket = 'LBRACKET',
  RBracket = 'RBRACKET',
  Eof = 'EOF',
}

/** Token value variants */
export type TokenValueType =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'none' };

/** A single token from the lexer */
export interface Token {
  type: TokenType;
  value: TokenValueType;
  line: number;
  column: number;
}
