import { LeanParseError } from './errors.js';
import { JsLeanParser } from './js-parser.js';
import type { ParseOptions } from './types.js';

type WasmParseFn = (input: string, strict: boolean | null) => unknown;

let wasmParse: WasmParseFn | null = null;
let wasmError: Error | null = null;

/**
 * Try to load the WASM parser module.
 * Silently falls back to the JS parser if WASM is unavailable.
 */
async function loadWasmParser(): Promise<void> {
  if (wasmParse !== null || wasmError !== null) return;

  try {
    const wasmModule = await import('lean-parser-rs');
    wasmParse = wasmModule.parse as WasmParseFn;
  } catch (err) {
    wasmError = err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Check if WASM parser is available (synchronous check after attempted load).
 */
export function isWasmAvailable(): boolean {
  return wasmParse !== null;
}

/**
 * Get the WASM load error, if any.
 */
export function getWasmError(): Error | null {
  return wasmError;
}

/**
 * Initialize the parser, ensuring WASM is loaded.
 * Call this once before using parse() if you want to ensure WASM is available.
 */
export async function initParser(): Promise<void> {
  await loadWasmParser();
}

/**
 * Parse LEAN format text into a JavaScript object.
 *
 * Uses the Rust WASM parser when available, with a pure TypeScript fallback.
 *
 * @param input - LEAN format text
 * @param options - Parser configuration
 * @returns Parsed JavaScript object
 * @throws {LeanParseError} If parsing fails
 */
export function parse(input: string, options: ParseOptions = {}): unknown {
  if (typeof input !== 'string') {
    throw new LeanParseError('Input must be a string', 0, 0);
  }

  const strict = options.strict ?? false;

  if (wasmParse !== null) {
    try {
      return wasmParse(input, strict);
    } catch (err) {
      if (err instanceof LeanParseError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new LeanParseError(msg, 0, 0);
    }
  }

  // Fall back to the TypeScript parser
  const jsParser = new JsLeanParser(strict);
  return jsParser.parse(input);
}

/**
 * Parse LEAN synchronously, initializing WASM first if needed.
 * Use this for the initial parse when you want to ensure WASM is loaded.
 */
export function parseSync(input: string, options: ParseOptions = {}): unknown {
  return parse(input, options);
}
