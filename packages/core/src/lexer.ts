import { Token, TokenType, TokenValueType } from './types.js';
import { LeanParseError } from './errors.js';

/**
 * Pure TypeScript LEAN lexer (tokenizer).
 * Used as a fallback when the WASM parser is unavailable.
 */
export class LeanLexer {
  private input: string;
  private pos: number;
  public line: number;
  public column: number;
  private indentStack: number[];
  public tokens: Token[];
  private indentationHandled: boolean;
  private indentChar: string | null;

  constructor(input: string) {
    const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.input = normalized;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.indentStack = [0];
    this.tokens = [];
    this.indentationHandled = false;
    this.indentChar = null;
  }

  tokenize(): Token[] {
    while (this.pos < this.input.length) {
      const ch = this.peek();

      if (ch === '\n') {
        this.addToken(TokenType.Newline, { kind: 'string', value: '\n' });
        this.advance();
        this.line++;
        this.column = 1;
        this.indentationHandled = false;
        continue;
      }

      if (this.column === 1 && !this.indentationHandled) {
        this.handleIndentation();
        this.indentationHandled = true;
        if (this.pos >= this.input.length) break;
        continue;
      }

      if (ch === ' ' || ch === '\t') {
        this.advance();
        continue;
      }

      if (ch === '#') {
        this.skipComment();
        continue;
      }

      if (ch === ':') {
        this.addToken(TokenType.Colon, { kind: 'string', value: ':' });
        this.advance();
        continue;
      }

      if (ch === '-') {
        if (this.isNextDigit()) {
          this.readNumber();
        } else {
          this.addToken(TokenType.Hyphen, { kind: 'string', value: '-' });
          this.advance();
        }
        continue;
      }

      if (ch === ',') {
        this.addToken(TokenType.Comma, { kind: 'string', value: ',' });
        this.advance();
        continue;
      }

      if (ch === '(') {
        this.addToken(TokenType.LParen, { kind: 'string', value: '(' });
        this.advance();
        continue;
      }

      if (ch === ')') {
        this.addToken(TokenType.RParen, { kind: 'string', value: ')' });
        this.advance();
        continue;
      }

      if (ch === '{') {
        this.addToken(TokenType.LBrace, { kind: 'string', value: '{' });
        this.advance();
        continue;
      }

      if (ch === '}') {
        this.addToken(TokenType.RBrace, { kind: 'string', value: '}' });
        this.advance();
        continue;
      }

      if (ch === '[') {
        this.addToken(TokenType.LBracket, { kind: 'string', value: '[' });
        this.advance();
        continue;
      }

      if (ch === ']') {
        this.addToken(TokenType.RBracket, { kind: 'string', value: ']' });
        this.advance();
        continue;
      }

      if (ch === '"') {
        this.readString();
        continue;
      }

      if (isDigit(ch)) {
        this.readNumber();
        continue;
      }

      if (isIdentifierStart(ch)) {
        this.readIdentifier();
        continue;
      }

      throw new LeanParseError(
        `Unexpected character '${ch}'`,
        this.line,
        this.column,
        this.getSnippet(),
      );
    }

    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.addToken(TokenType.Dedent, { kind: 'string', value: '' });
    }

    this.addToken(TokenType.Eof, { kind: 'string', value: '' });
    return this.tokens;
  }

  private handleIndentation(): void {
    let indentLevel = 0;
    let currentPos = this.pos;

    while (currentPos < this.input.length) {
      const ch = this.input[currentPos];
      if (ch === ' ' || ch === '\t') {
        if (this.indentChar === null) {
          this.indentChar = ch;
        } else if (ch !== this.indentChar) {
          throw new LeanParseError(
            'Mixed indentation (spaces and tabs)',
            this.line,
            this.column,
            this.getSnippet(),
            'Use consistent indentation — either spaces or tabs, not both.',
          );
        }
        indentLevel += ch === '\t' ? 4 : 1;
      } else {
        break;
      }
      currentPos++;
    }

    if (currentPos >= this.input.length || this.input[currentPos] === '\n' || this.input[currentPos] === '#') {
      const indentLength = currentPos - this.pos;
      this.pos = currentPos;
      this.column += indentLength;
      return;
    }

    const currentIndent = this.indentStack[this.indentStack.length - 1];

    if (indentLevel > currentIndent) {
      this.indentStack.push(indentLevel);
      this.addToken(TokenType.Indent, { kind: 'number', value: indentLevel });
    } else if (indentLevel < currentIndent) {
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indentLevel) {
        this.indentStack.pop();
        this.addToken(TokenType.Dedent, { kind: 'string', value: '' });
      }
    }

    const indentLength = currentPos - this.pos;
    this.pos = currentPos;
    this.column += indentLength;
  }

  private skipComment(): void {
    while (this.pos < this.input.length && this.peek() !== '\n') {
      this.advance();
    }
  }

  private readString(): void {
    let value = '';
    this.advance(); // Skip opening quote

    while (this.pos < this.input.length) {
      const ch = this.peek();
      if (ch === '"') {
        this.advance(); // Skip closing quote
        this.addToken(TokenType.String, { kind: 'string', value });
        return;
      }
      if (ch === '\\') {
        this.advance();
        if (this.pos >= this.input.length) {
          throw new LeanParseError('Unterminated string', this.line, this.column, this.getSnippet());
        }
        const escape = this.peek();
        switch (escape) {
          case 'n': value += '\n'; break;
          case 'r': value += '\r'; break;
          case 't': value += '\t'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          default: value += escape; break;
        }
        this.advance();
      } else {
        value += ch;
        this.advance();
      }
    }
    throw new LeanParseError('Unterminated string', this.line, this.column, this.getSnippet());
  }

  private readNumber(): void {
    let value = '';
    if (this.peek() === '-') {
      value += '-';
      this.advance();
    }

    while (this.pos < this.input.length) {
      const ch = this.peek();
      if (isDigit(ch) || ch === '.' || ch === 'e' || ch === 'E' || ch === '-' || ch === '+') {
        if ((ch === '-' || ch === '+') && value.length > 0 && !/e|E/.test(value)) {
          break;
        }
        value += ch;
        this.advance();
      } else {
        break;
      }
    }

    const num = parseFloat(value);
    if (isFinite(num)) {
      this.addToken(TokenType.Number, { kind: 'number', value: num });
    } else {
      throw new LeanParseError(`Invalid number format '${value}'`, this.line, this.column, this.getSnippet());
    }
  }

  private readIdentifier(): void {
    let value = '';
    while (this.pos < this.input.length) {
      const ch = this.peek();
      if (isIdentifierPart(ch)) {
        value += ch;
        this.advance();
      } else {
        break;
      }
    }

    switch (value) {
      case 'true':
        this.addToken(TokenType.Boolean, { kind: 'boolean', value: true });
        break;
      case 'false':
        this.addToken(TokenType.Boolean, { kind: 'boolean', value: false });
        break;
      case 'null':
        this.addToken(TokenType.Null, { kind: 'null' });
        break;
      default:
        this.addToken(TokenType.Identifier, { kind: 'string', value });
        break;
    }
  }

  private peek(): string {
    return this.input[this.pos];
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private addToken(type: TokenType, value: TokenValueType): void {
    this.tokens.push({ type, value, line: this.line, column: this.column });
  }

  private isNextDigit(): boolean {
    return this.pos + 1 < this.input.length && isDigit(this.input[this.pos + 1]);
  }

  private getSnippet(): string | undefined {
    const start = Math.max(0, this.pos - 20);
    const end = Math.min(this.input.length, this.pos + 20);
    return this.input.slice(start, end).replace(/\n/g, '\\n');
  }
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentifierStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentifierPart(ch: string): boolean {
  return isIdentifierStart(ch) || isDigit(ch) || ch === '-' || ch === '.';
}
