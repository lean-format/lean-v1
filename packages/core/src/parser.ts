import { ErrorCode, LeanParseError } from './errors.js';
import { JsLeanParser } from './js-parser.js';
import type { ParseOptions } from './types.js';

type WasmParseFn = (input: string, strict: boolean | null) => unknown;

let wasmParse: WasmParseFn | null = null;
let wasmError: Error | null = null;
let wasmLoading: Promise<void> | null = null;

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
 * Lazily start loading WASM in the background.
 * Returns true if WASM is already available synchronously.
 */
function ensureWasmInit(): boolean {
  if (wasmParse !== null) return true;
  if (wasmLoading === null && wasmError === null) {
    wasmLoading = loadWasmParser().finally(() => { wasmLoading = null; });
  }
  return false;
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

function validateInput(input: string, options: ParseOptions): void {
  const maxInputSize = options.maxInputSize ?? 0;
  if (maxInputSize > 0 && Buffer.byteLength(input, 'utf-8') > maxInputSize) {
    throw new LeanParseError(
      `Input exceeds maximum size of ${maxInputSize} bytes (got ${Buffer.byteLength(input, 'utf-8')} bytes)`,
      0, 0, undefined, `Increase maxInputSize or reduce input size.`,
      ErrorCode.INPUT_TOO_LARGE,
    );
  }
}

/**
 * Parse LEAN format text into a JavaScript object.
 *
 * Uses the Rust WASM parser when available, with a pure TypeScript fallback.
 * WASM is lazily loaded in the background on first call; subsequent calls may use it.
 *
 * @param input - LEAN format text
 * @param options - Parser configuration
 * @returns Parsed JavaScript object
 * @throws {LeanParseError} If parsing fails
 */
export function parse(input: string, options: ParseOptions = {}): unknown {
  if (typeof input !== 'string') {
    throw new LeanParseError('Input must be a string', 0, 0, undefined, undefined, ErrorCode.INVALID_INPUT);
  }

  const strict = options.strict ?? false;

  // Auto-init WASM in background on first use
  ensureWasmInit();

  if (typeof wasmParse === 'function') {
    validateInput(input, options);
    try {
      return wasmParse(input, strict);
    } catch (err) {
      if (err instanceof LeanParseError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new LeanParseError(msg, 0, 0, undefined, undefined, ErrorCode.PARSE_ERROR);
    }
  }

  // Fall back to the TypeScript parser
  validateInput(input, options);
  const jsParser = new JsLeanParser(strict, options);
  return jsParser.parse(input);
}

/**
 * Parse LEAN synchronously.
 * First checks if WASM is available synchronously; if not, uses JS parser.
 */
export function parseSync(input: string, options: ParseOptions = {}): unknown {
  return parse(input, options);
}
