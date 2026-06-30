import type { ParseOptions } from './types.js';
/**
 * Parse LEAN format text and return the resulting data object.
 */
export declare function parse(input: string, options?: ParseOptions): Record<string, unknown>;
/**
 * Synchronous alias for parse.
 */
export declare const parseSync: typeof parse;
/**
 * Pure TypeScript LEAN parser.
 * Used as a fallback when the WASM parser is unavailable.
 * Mirrors the behavior of the Rust WASM parser.
 */
export declare class JsLeanParser {
    private strict;
    private tokens;
    private pos;
    private seenKeys;
    private maxDepth;
    constructor(strict?: boolean, options?: ParseOptions);
    parse(input: string): Record<string, unknown>;
    private checkDepth;
    private parseBlock;
    private deepMerge;
    private parseItem;
    private parseRowList;
    private parseValue;
    private parseList;
    private parseSimpleValue;
    private parseInlineObject;
    private parseInlineArray;
    private expandDotNotation;
    private peek;
    private advance;
    private consume;
    private getStringValue;
    private getNumberValue;
    private getBooleanValue;
}
//# sourceMappingURL=js-parser.d.ts.map