import { LeanLexer } from './lexer.js';
import { Token, TokenType } from './types.js';
import { LeanParseError } from './errors.js';

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

  constructor(strict: boolean = false) {
    this.strict = strict;
    this.tokens = [];
    this.pos = 0;
    this.seenKeys = new Map();
  }

  parse(input: string): Record<string, unknown> {
    const lexer = new LeanLexer(input);
    this.tokens = lexer.tokenize();
    this.pos = 0;
    this.seenKeys.clear();

    const result = this.parseBlock();

    if (this.peek().type !== TokenType.Eof) {
      throw new LeanParseError(
        `Unexpected token after end of document: ${this.peek().type}`,
        this.peek().line,
        this.peek().column,
      );
    }

    return result as Record<string, unknown>;
  }

  private parseBlock(level: number = 0): Record<string, unknown> {
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
      );
    }

    if (keyToken.type !== TokenType.Identifier && keyToken.type !== TokenType.String) {
      throw new LeanParseError(
        `Expected key-value pair or row syntax (identifier)`,
        keyToken.line,
        keyToken.column,
        undefined,
        'Keys must start with a letter, underscore, or dollar sign.',
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
      );
    }
    this.advance(); // skip colon

    const value = this.parseValue(level);

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
        values.push(this.parseSimpleValue());
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

    this.consume(TokenType.Dedent);

    if (key.includes('.')) {
      return this.expandDotNotation(key, rows);
    }

    return [key, rows];
  }

  private parseValue(level: number): unknown {
    if (this.peek().type === TokenType.Newline) {
      this.advance();
      if (this.peek().type === TokenType.Indent) {
        this.advance();
        if (this.peek().type === TokenType.Hyphen) {
          const list = this.parseList(level + 1);
          this.consume(TokenType.Dedent);
          return list;
        } else {
          const obj = this.parseBlock(level + 1);
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

    return this.parseSimpleValue();
  }

  private parseList(level: number): unknown[] {
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
        const isObject =
          this.peek().type === TokenType.Identifier || this.peek().type === TokenType.String;
        const nextPeek = this.pos + 1 < this.tokens.length ? this.tokens[this.pos + 1] : null;

        if (isObject && nextPeek && nextPeek.type === TokenType.Colon) {
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
          list.push(this.parseSimpleValue());
          if (this.peek().type === TokenType.Newline) {
            this.advance();
          }
        }
      }
    }

    return list;
  }

  private parseSimpleValue(): unknown {
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
        throw new LeanParseError(
          "Expected '}' for empty object",
          token.line,
          token.column,
        );

      case TokenType.LBracket:
        if (this.peek().type === TokenType.RBracket) {
          this.advance();
          return [];
        }
        throw new LeanParseError(
          "Expected ']' for empty list",
          token.line,
          token.column,
        );

      default:
        throw new LeanParseError(
          `Unexpected token for value: ${token.type}`,
          token.line,
          token.column,
        );
    }
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
