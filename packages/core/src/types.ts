export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface SourceLocation {
  start: Position;
  end: Position;
}

export type ASTNodeType =
  | 'model'
  | 'enum'
  | 'relation'
  | 'constraint'
  | 'type'
  | 'doc'
  | 'field'
  | 'attribute'
  | 'identifier'
  | 'string'
  | 'number'
  | 'boolean'
  | 'comment';

export interface ASTNode {
  type: ASTNodeType;
  name?: string;
  value?: unknown;
  loc: SourceLocation;
  children?: ASTNode[];
  attributes?: Record<string, string | number | boolean>;
}

export interface ParseResult {
  success: boolean;
  ast: ASTNode[];
  errors: ParseError[];
  source: string;
}

export interface ParseError {
  message: string;
  loc: SourceLocation;
  severity: 'error' | 'warning';
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  message: string;
  loc: SourceLocation;
  severity: ValidationSeverity;
  code?: string;
}

export interface ParseOptions {
  strict?: boolean;
  maxDepth?: number;
  maxInputSize?: number;
  useDotNotation?: boolean;
}

export interface FormatOptions {
  indent?: string;
  useRowSyntax?: boolean;
  rowThreshold?: number;
  useDotNotation?: boolean;
  sortKeys?: boolean;
}

export interface LeanSchema {
  type?: string;
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
}

export interface SchemaValidationError {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
}

export interface QueryResult {
  value: unknown;
  path: string;
  exists: boolean;
}

export type DiffEntry =
  | { type: 'added'; path: string; newValue: unknown }
  | { type: 'removed'; path: string; oldValue: unknown }
  | { type: 'changed'; path: string; oldValue: unknown; newValue: unknown };

export interface ValidationError {
  line: number;
  column?: number;
  message: string;
  snippet?: string;
  suggestion?: string;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationError[];
}

export type TokenValueType =
  | { kind: 'null' }
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean };

export const TokenType = {
  Newline: 'Newline',
  Colon: 'Colon',
  Hyphen: 'Hyphen',
  Comma: 'Comma',
  LParen: 'LParen',
  RParen: 'RParen',
  LBrace: 'LBrace',
  RBrace: 'RBrace',
  LBracket: 'LBracket',
  RBracket: 'RBracket',
  String: 'String',
  Number: 'Number',
  Boolean: 'Boolean',
  Null: 'Null',
  Identifier: 'Identifier',
  Indent: 'Indent',
  Dedent: 'Dedent',
  Eof: 'Eof',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  value: TokenValueType;
  line: number;
  column: number;
}

export const LEAN_VERSION = '0.1.0';
