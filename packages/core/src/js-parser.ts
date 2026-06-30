import { LeanLexer } from './lexer.js';
import { Token, TokenType } from './types.js';
import { ErrorCode, LeanParseError } from './errors.js';
import type { ParseOptions } from './types.js';

const DEFAULT_MAX_DEPTH = 100;

/**
 * Parse LEAN format text and return the resulting data object.
 */
export function parse(input: string, options: ParseOptions = {}): Record<string, unknown> {
  const parser = new JsLeanParser(options.strict ?? false, options);
  return parser.parse(input);
}

/**
 * Synchronous alias for parse.
 */
export const parseSync = parse;

/**
 * Pure TypeScript LEAN parser.
 * Used as a fallback when the WASM parser is unavailable.
 * Mirrors the behavior of the Rust WASM parser.
 */
export class JsLeanParser {
  private strict: boolean;
  private tokens: Token[];
  private pos: number;
  private seenKeys: Map<string, number>;
  private maxDepth: number;

  constructor(strict: boolean = false, options: ParseOptions = {}) {
    this.strict = strict;
    this.tokens = [];
    this.pos = 0;
    this.seenKeys = new Map();
    this.maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  }

  parse(input: string): Record<string, unknown> {
    const lexer = new LeanLexer(input);
    this.tokens = lexer.tokenize();
    this.pos = 0;
    this.seenKeys.clear();

    const result = this.parseBlock(0);

    if (this.peek().type !== TokenType.Eof) {
      throw new LeanParseError(
        `Unexpected token after end of document: ${this.peek().type}`,
        this.peek().line,
        this.peek().column,
        undefined, undefined,
        ErrorCode.UNEXPECTED_TOKEN,
      );
    }

    return result as Record<string, unknown>;
  }

  private checkDepth(level: number): void {
    if (this.maxDepth > 0 && level > this.maxDepth) {
      throw new LeanParseError(
        `Maximum nesting depth of ${this.maxDepth} exceeded`,
        0, 0, undefined,
        `Increase maxDepth option or flatten your data structure.`,
        ErrorCode.DEPTH_EXCEEDED,
      );
    }
  }

  private parseBlock(level: number = 0): Record<string, unknown> {
    this.checkDepth(level);
    const obj: Record<string, unknown> = {};

    while (
      this.peek().type !== TokenType.Eof &&
      this.peek().type !== TokenType.Dedent
    ) {
      if (this.peek().type === TokenType.Indent) {
        throw new LeanParseError(
          'Unexpected indentation at document root (or inside block)',
          this.peek().line,
          this.peek().column,
          undefined, undefined,
          ErrorCode.UNEXPECTED_INDENT,
        );
      }
      if (this.peek().type === TokenType.Newline) {
        this.advance();
        continue;
      }

      const item = this.parseItem(level);
      if (item) {
        const [key, val] = item;
        this.deepMerge(obj, key, val);
      }
    }

    return obj;
  }

  private deepMerge(target: Record<string, unknown>, key: string, source: unknown): void {
    if (key in target && typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key]) &&
        typeof source === 'object' && source !== null && !Array.isArray(source)) {
      const targetObj = target[key] as Record<string, unknown>;
      const sourceObj = source as Record<string, unknown>;
      for (const [k, v] of Object.entries(sourceObj)) {
        this.deepMerge(targetObj, k, v);
      }
    } else {
      target[key] = source;
    }
  }

  private parseItem(level: number): [string, unknown] | null {
    const keyToken = this.peek();

    if (keyToken.type === TokenType.Hyphen) {
      throw new LeanParseError(
        'Unexpected list item. Expected key.',
        keyToken.line,
        keyToken.column,
        undefined,
        'List items must be inside a keyed list. Did you forget to add a key?',
        ErrorCode.UNEXPECTED_TOKEN,
      );
    }

    if (keyToken.type !== TokenType.Identifier && keyToken.type !== TokenType.String) {
      throw new LeanParseError(
        `Expected key-value pair or row syntax (identifier)`,
        keyToken.line,
        keyToken.column,
        undefined,
        'Keys must start with a letter, underscore, or dollar sign.',
        ErrorCode.UNEXPECTED_TOKEN,
      );
    }

    const key = this.getStringValue(keyToken);
    this.advance();

    if (this.strict) {
      const keyPath = key;
      if (this.seenKeys.has(keyPath)) {
        throw new LeanParseError(
          `Duplicate key: '${keyPath}'`,
          keyToken.line,
          keyToken.column,
          undefined,
          'Remove or rename the duplicate key.',
          ErrorCode.DUPLICATE_KEY,
        );
      }
      this.seenKeys.set(keyPath, keyToken.line);
    }

    // Row syntax: key(col1, col2):
    if (this.peek().type === TokenType.LParen) {
      return this.parseRowList(key);
    }

    if (this.peek().type !== TokenType.Colon) {
      throw new LeanParseError(
        `Expected ':' after key`,
        keyToken.line,
        keyToken.column,
        undefined, undefined,
        ErrorCode.EXPECTED_COLON,
      );
    }
    this.advance(); // skip colon

    const value = this.parseValue(level + 1);

    if (key.includes('.')) {
      return this.expandDotNotation(key, value);
    }

    return [key, value];
  }

  private parseRowList(key: string): [string, unknown] {
    this.consume(TokenType.LParen);
    const columns: string[] = [];

    while (this.peek().type !== TokenType.RParen) {
      const colToken = this.consume(TokenType.Identifier);
      columns.push(this.getStringValue(colToken));
      if (this.peek().type === TokenType.Comma) {
        this.advance();
      }
    }
    this.consume(TokenType.RParen);
    this.consume(TokenType.Colon);

    if (this.peek().type === TokenType.Newline) {
      this.advance();
    } else if (this.peek().type === TokenType.Eof) {
      return [key, []];
    }

    if (this.peek().type === TokenType.Indent) {
      this.consume(TokenType.Indent);
    } else {
      return [key, []];
    }

    const rows: Record<string, unknown>[] = [];
    while (this.peek().type === TokenType.Hyphen) {
      this.advance(); // skip hyphen
      const values: unknown[] = [];

      while (this.peek().type !== TokenType.Newline && this.peek().type !== TokenType.Eof) {
        values.push(this.parseSimpleValue(0));
        if (this.peek().type === TokenType.Comma) {
          this.advance();
        } else {
          break;
        }
      }

      if (this.strict && values.length > columns.length) {
        throw new LeanParseError(
          `Row has ${values.length} values but header defines ${columns.length} columns`,
          this.peek().line,
          this.peek().column,
          undefined,
          `Expected ${columns.length} values: ${columns.join(', ')}`,
          ErrorCode.EXTRA_ROW_VALUES,
        );
      }

      if (!this.strict && values.length > columns.length) {
        console.warn(
          `[LEAN Warning] Row at line ${this.peek().line} has ${values.length} values but header defines ${columns.length} columns. Extra values will be ignored.`,
        );
      }

      const row: Record<string, unknown> = {};
      for (let idx = 0; idx < columns.length; idx++) {
        row[columns[idx]] = idx < values.length ? values[idx] : null;
      }
      rows.push(row);

      if (this.peek().type === TokenType.Newline) {
        this.advance();
      }
    }

    while (this.peek().type === TokenType.Newline) {
      this.advance();
    }
    this.consume(TokenType.Dedent);

    if (key.includes('.')) {
      return this.expandDotNotation(key, rows);
    }

    return [key, rows];
  }

  private parseValue(level: number): unknown {
    if (this.peek().type === TokenType.Newline) {
      this.advance();
      while (this.peek().type === TokenType.Newline) {
        this.advance();
      }
      if (this.peek().type === TokenType.Indent) {
        this.advance();
        if (this.peek().type === TokenType.Hyphen) {
          const list = this.parseList(level);
          while (this.peek().type === TokenType.Newline) {
            this.advance();
          }
          this.consume(TokenType.Dedent);
          return list;
        } else {
          const obj = this.parseBlock(level);
          while (this.peek().type === TokenType.Newline) {
            this.advance();
          }
          this.consume(TokenType.Dedent);
          return obj;
        }
      } else {
        return null; // empty value
      }
    }

    if (this.peek().type === TokenType.Eof || this.peek().type === TokenType.Dedent) {
      return null;
    }

    return this.parseSimpleValue(level);
  }

  private parseList(level: number): unknown[] {
    this.checkDepth(level);
    const list: unknown[] = [];

    while (this.peek().type === TokenType.Hyphen) {
      this.advance();

      if (this.peek().type === TokenType.Newline) {
        this.advance();
        this.consume(TokenType.Indent);
        if (this.peek().type === TokenType.Hyphen) {
          list.push(this.parseList(level + 1));
        } else {
          list.push(this.parseBlock(level + 1));
        }
        this.consume(TokenType.Dedent);
      } else {
        const isKeyValuePair =
          (this.peek().type === TokenType.Identifier || this.peek().type === TokenType.String) &&
          this.pos + 1 < this.tokens.length &&
          this.tokens[this.pos + 1].type === TokenType.Colon;

        if (isKeyValuePair) {
          const itemObj: Record<string, unknown> = {};
          const item = this.parseItem(level);
          if (item) {
            this.deepMerge(itemObj, item[0], item[1]);
          }

          if (this.peek().type === TokenType.Newline) {
            this.advance();
          }

          if (this.peek().type === TokenType.Indent) {
            this.advance();
            const restBlock = this.parseBlock(level + 1);
            for (const [k, v] of Object.entries(restBlock)) {
              this.deepMerge(itemObj, k, v);
            }
            this.consume(TokenType.Dedent);
          }
          list.push(itemObj);
        } else {
          list.push(this.parseSimpleValue(level));
          if (this.peek().type === TokenType.Newline) {
            this.advance();
          }
        }
      }
    }

    return list;
  }

  private parseSimpleValue(level: number = 0): unknown {
    const token = this.peek();
    this.advance();

    switch (token.type) {
      case TokenType.String:
      case TokenType.Identifier:
        return this.getStringValue(token);

      case TokenType.Number:
        return this.getNumberValue(token);

      case TokenType.Boolean:
        return this.getBooleanValue(token);

      case TokenType.Null:
        return null;

      case TokenType.LBrace:
        if (this.peek().type === TokenType.RBrace) {
          this.advance();
          return {};
        }
        // Inline object: { key: value, ... }
        return this.parseInlineObject(level);

      case TokenType.LBracket:
        if (this.peek().type === TokenType.RBracket) {
          this.advance();
          return [];
        }
        // Inline array: [ value, ... ]
        return this.parseInlineArray(level);

      default:
        throw new LeanParseError(
          `Unexpected token for value: ${token.type}`,
          token.line,
          token.column,
          undefined, undefined,
          ErrorCode.UNEXPECTED_TOKEN,
        );
    }
  }

  private parseInlineObject(level: number): Record<string, unknown> {
    this.checkDepth(level);
    const obj: Record<string, unknown> = {};

    while (this.peek().type !== TokenType.RBrace) {
      const keyToken = this.peek();
      if (keyToken.type !== TokenType.Identifier && keyToken.type !== TokenType.String) {
        break;
      }
      const key = this.getStringValue(keyToken);
      this.advance();

      if (this.peek().type !== TokenType.Colon) break;
      this.advance();
      obj[key] = this.parseSimpleValue(level + 1);

      if (this.peek().type === TokenType.Comma) {
        this.advance();
      } else {
        break;
      }
    }

    if (this.peek().type === TokenType.RBrace) {
      this.advance();
      return obj;
    }
    throw new LeanParseError(
      "Expected '}' for inline object",
      0, 0,
      undefined, undefined,
      ErrorCode.EXPECTED_RBRACE,
    );
  }

  private parseInlineArray(level: number): unknown[] {
    this.checkDepth(level);
    const arr: unknown[] = [];

    while (this.peek().type !== TokenType.RBracket) {
      arr.push(this.parseSimpleValue(level + 1));
      if (this.peek().type === TokenType.Comma) {
        this.advance();
      } else {
        break;
      }
    }

    if (this.peek().type === TokenType.RBracket) {
      this.advance();
      return arr;
    }
    throw new LeanParseError(
      "Expected ']' for inline array",
      0, 0,
      undefined, undefined,
      ErrorCode.EXPECTED_RBRACKET,
    );
  }

  private expandDotNotation(key: string, value: unknown): [string, unknown] {
    const keys = key.split('.');
    let result = value;

    for (let i = keys.length - 1; i > 0; i--) {
      result = { [keys[i]]: result };
    }

    return [keys[0], result];
  }

  // --- Helper methods ---

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): void {
    if (this.pos < this.tokens.length - 1) {
      this.pos++;
    }
  }

  private consume(expected: TokenType): Token {
    const token = this.peek();
    if (token.type === expected) {
      this.advance();
      return token;
    }
    throw new LeanParseError(
      `Expected ${expected} but found ${token.type}`,
      token.line,
      token.column,
    );
  }

  private getStringValue(token: Token): string {
    if (token.value.kind === 'string') return token.value.value;
    throw new LeanParseError(`Expected string value`, token.line, token.column);
  }

  private getNumberValue(token: Token): number {
    if (token.value.kind === 'number') return token.value.value;
    throw new LeanParseError(`Expected number value`, token.line, token.column);
  }

  private getBooleanValue(token: Token): boolean {
    if (token.value.kind === 'boolean') return token.value.value;
    throw new LeanParseError(`Expected boolean value`, token.line, token.column);
  }
}
