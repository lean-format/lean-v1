// ============================================================================
// LEAN Format - Core Library
// Lightweight Efficient Adaptive Notation
// ============================================================================

// Parser
export { parse, parseSync, initParser, isWasmAvailable, getWasmError } from './parser.js';
export { JsLeanParser } from './js-parser.js';

// Serializer
export { format } from './serializer.js';

// Validator
export { validate, validateStrict } from './validator.js';

// Schema validation
export { SchemaValidator, validateSchema, generateSchema } from './schema.js';

// Query and diff (creative features)
export { query } from './query.js';
export { diff, formatDiff } from './diff.js';

// Cache
export { ParseCache, cachedParse, defaultCache } from './cache.js';

// Incremental parser
export { IncrementalParser, parseIncremental, defaultIncrementalParser } from './incremental.js';

// Semantic analysis
export { analyze, hasWarnings, formatWarnings } from './semantic.js';
export type { SemanticWarning, SemanticResult } from './semantic.js';

// Types
export type {
  LeanValue,
  ParseOptions,
  FormatOptions,
  ValidationError,
  ValidationResult,
  LeanSchema,
  SchemaValidationError,
  SchemaValidationResult,
  DiffEntry,
  QueryResult,
} from './types.js';

// Classes
export { LeanParseError, LeanSerializeError, ErrorCode } from './errors.js';
export type { ErrorCodeType } from './errors.js';
