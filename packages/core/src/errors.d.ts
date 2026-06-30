import type { ValidationError } from './types.js';
/**
 * Error codes for structured error handling.
 */
export declare const ErrorCode: {
    readonly PARSE_ERROR: "PARSE_ERROR";
    readonly UNEXPECTED_TOKEN: "UNEXPECTED_TOKEN";
    readonly UNEXPECTED_CHARACTER: "UNEXPECTED_CHARACTER";
    readonly UNTERMINATED_STRING: "UNTERMINATED_STRING";
    readonly INVALID_NUMBER: "INVALID_NUMBER";
    readonly EXPECTED_COLON: "EXPECTED_COLON";
    readonly EXPECTED_KEY: "EXPECTED_KEY";
    readonly EXPECTED_RBRACE: "EXPECTED_RBRACE";
    readonly EXPECTED_RBRACKET: "EXPECTED_RBRACKET";
    readonly DUPLICATE_KEY: "DUPLICATE_KEY";
    readonly EXTRA_ROW_VALUES: "EXTRA_ROW_VALUES";
    readonly MIXED_INDENTATION: "MIXED_INDENTATION";
    readonly UNEXPECTED_INDENT: "UNEXPECTED_INDENT";
    readonly DEPTH_EXCEEDED: "DEPTH_EXCEEDED";
    readonly INPUT_TOO_LARGE: "INPUT_TOO_LARGE";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly SERIALIZE_ERROR: "SERIALIZE_ERROR";
    readonly UNSUPPORTED_VALUE: "UNSUPPORTED_VALUE";
};
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
/**
 * Structured LEAN parse error with location information and error code.
 */
export declare class LeanParseError extends Error {
    readonly line: number;
    readonly column: number;
    readonly snippet?: string;
    readonly suggestion?: string;
    readonly code: ErrorCodeType;
    constructor(message: string, line?: number, column?: number, snippet?: string, suggestion?: string, code?: ErrorCodeType);
    /** Convert to a ValidationError */
    toValidationError(): ValidationError;
}
/**
 * Serialization error with error code.
 */
export declare class LeanSerializeError extends Error {
    readonly code: ErrorCodeType;
    constructor(message: string, code?: ErrorCodeType);
}
//# sourceMappingURL=errors.d.ts.map