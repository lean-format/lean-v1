import { Token, TokenType, TokenValueType } from './types.js';
import { LeanParseError } from './errors.js';

export class LeanLexer {
  private input: string;
  private pos: number;
  private len: number;
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
    this.len = normalized.length;
    this.line = 1;
    this.column = 1;
    this.indentStack = [0];
    this.tokens = [];
    this.indentationHandled = false;
    this.indentChar = null;
  }

  tokenize(): Token[] {
    const input = this.input;
    const len = this.len;
    const tokens = this.tokens;
    let pos = this.pos;
    let line = this.line;
    let col = this.column;

    while (pos < len) {
      const ch = input[pos];

      if (ch === '\n') {
        tokens.push({ type: TokenType.Newline, value: kNlTok, line, column: col });
        pos++;
        line++;
        col = 1;
        this.indentationHandled = false;
        continue;
      }

      // Only check indentation at start of line (column === 1)
      if (col === 1 && !this.indentationHandled) {
        const result = this.handleIndentation(input, len, pos, line, col);
        pos = result.pos;
        col = result.col;
        this.indentationHandled = true;
        if (pos >= len) break;
        continue;
      }

      if (ch === ' ' || ch === '\t') {
        pos++;
        col++;
        continue;
      }

      if (ch === '#') {
        while (pos < len && input[pos] !== '\n') pos++;
        col = 1;
        continue;
      }

      if (ch === ':') {
        tokens.push({ type: TokenType.Colon, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === '-') {
        if (pos + 1 < len && input[pos + 1] >= '0' && input[pos + 1] <= '9') {
          const result = this.readNumber(input, len, pos, line, col, tokens);
          pos = result.pos;
          col = result.col;
        } else {
          tokens.push({ type: TokenType.Hyphen, value: kNlTok, line, column: col });
          pos++;
          col++;
        }
        continue;
      }

      if (ch === ',') {
        tokens.push({ type: TokenType.Comma, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === '(') {
        tokens.push({ type: TokenType.LParen, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === ')') {
        tokens.push({ type: TokenType.RParen, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === '{') {
        tokens.push({ type: TokenType.LBrace, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === '}') {
        tokens.push({ type: TokenType.RBrace, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === '[') {
        tokens.push({ type: TokenType.LBracket, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === ']') {
        tokens.push({ type: TokenType.RBracket, value: kNlTok, line, column: col });
        pos++;
        col++;
        continue;
      }

      if (ch === '"') {
        const result = this.readString(input, len, pos, line, col, tokens);
        pos = result.pos;
        col = result.col;
        continue;
      }

      if (ch >= '0' && ch <= '9') {
        const result = this.readNumber(input, len, pos, line, col, tokens);
        pos = result.pos;
        col = result.col;
        continue;
      }

      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$') {
        const result = this.readIdentifier(input, len, pos, line, col, tokens);
        pos = result.pos;
        col = result.col;
        continue;
      }

      const snippet = input.slice(Math.max(0, pos - 20), Math.min(len, pos + 20)).replace(/\n/g, '\\n');
      throw new LeanParseError(
        `Unexpected character '${ch}'`,
        line, col, snippet,
      );
    }

    this.pos = pos;
    this.line = line;
    this.column = col;

    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      tokens.push({ type: TokenType.Dedent, value: kNlTok, line, column: col });
    }

    tokens.push({ type: TokenType.Eof, value: kNlTok, line, column: col });
    return tokens;
  }

  private handleIndentation(input: string, len: number, pos: number, line: number, col: number): { pos: number; col: number } {
    let indentLevel = 0;
    const start = pos;

    while (pos < len) {
      const ch = input[pos];
      if (ch === ' ' || ch === '\t') {
        if (this.indentChar === null) {
          this.indentChar = ch;
        } else if (ch !== this.indentChar) {
          throw new LeanParseError(
            'Mixed indentation (spaces and tabs)',
            line, col, input.slice(Math.max(0, start - 20), Math.min(len, start + 20)).replace(/\n/g, '\\n'),
          );
        }
        indentLevel += ch === '\t' ? 4 : 1;
      } else {
        break;
      }
      pos++;
    }

    if (pos >= len || input[pos] === '\n' || input[pos] === '#') {
      col += (pos - start);
      return { pos, col };
    }

    const stack = this.indentStack;
    const currentIndent = stack[stack.length - 1];

    if (indentLevel > currentIndent) {
      stack.push(indentLevel);
      this.tokens.push({ type: TokenType.Indent, value: kNlTok, line, column: col });
    } else if (indentLevel < currentIndent) {
      while (stack.length > 1 && stack[stack.length - 1] > indentLevel) {
        stack.pop();
        this.tokens.push({ type: TokenType.Dedent, value: kNlTok, line, column: col });
      }
    }

    col += (pos - start);
    return { pos, col };
  }

  private readString(input: string, len: number, startPos: number, line: number, col: number, tokens: Token[]): { pos: number; col: number } {
    const parts: string[] = [];
    let pos = startPos + 1; // skip opening quote
    let localCol = col + 1;

    while (pos < len) {
      const ch = input[pos];
      if (ch === '"') {
        pos++;
        localCol++;
        tokens.push({ type: TokenType.String, value: { kind: 'string', value: parts.join('') }, line, column: col });
        return { pos, col: localCol };
      }
      if (ch === '\\') {
        pos++;
        localCol++;
        if (pos >= len) {
          throw new LeanParseError('Unterminated string', line, col);
        }
        const esc = input[pos];
        switch (esc) {
          case 'n': parts.push('\n'); break;
          case 'r': parts.push('\r'); break;
          case 't': parts.push('\t'); break;
          case '\\': parts.push('\\'); break;
          case '"': parts.push('"'); break;
          default: parts.push(esc); break;
        }
        pos++;
        localCol++;
      } else {
        parts.push(ch);
        pos++;
        localCol++;
      }
    }
    throw new LeanParseError('Unterminated string', line, col);
  }

  private readNumber(input: string, len: number, startPos: number, line: number, col: number, tokens: Token[]): { pos: number; col: number } {
    let pos = startPos;
    const parts: string[] = [];
    if (input[pos] === '-') { parts.push('-'); pos++; }

    while (pos < len) {
      const ch = input[pos];
      if ((ch >= '0' && ch <= '9') || ch === '.' || ch === 'e' || ch === 'E') {
        parts.push(ch);
        pos++;
      } else if ((ch === '-' || ch === '+') && parts.length > 0) {
        const last = parts[parts.length - 1];
        if (last === 'e' || last === 'E') { parts.push(ch); pos++; }
        else break;
      } else {
        break;
      }
    }

    const value = parts.join('');
    const num = parseFloat(value);
    if (isFinite(num)) {
      tokens.push({ type: TokenType.Number, value: { kind: 'number', value: num }, line, column: col });
      return { pos, col: col + (pos - startPos) };
    }
    throw new LeanParseError(`Invalid number format`, line, col,
      input.slice(Math.max(0, startPos - 20), Math.min(len, startPos + 20)).replace(/\n/g, '\\n'));
  }

  private readIdentifier(input: string, len: number, startPos: number, line: number, col: number, tokens: Token[]): { pos: number; col: number } {
    let pos = startPos;
    while (pos < len) {
      const ch = input[pos];
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$' ||
          (ch >= '0' && ch <= '9') || ch === '-' || ch === '.') {
        pos++;
      } else {
        break;
      }
    }

    const value = input.slice(startPos, pos);
    switch (value) {
      case 'true':
        tokens.push({ type: TokenType.Boolean, value: { kind: 'boolean', value: true }, line, column: col });
        break;
      case 'false':
        tokens.push({ type: TokenType.Boolean, value: { kind: 'boolean', value: false }, line, column: col });
        break;
      case 'null':
        tokens.push({ type: TokenType.Null, value: kNlTok, line, column: col });
        break;
      default:
        tokens.push({ type: TokenType.Identifier, value: { kind: 'string', value }, line, column: col });
        break;
    }

    return { pos, col: col + (pos - startPos) };
  }
}

const kNlTok: TokenValueType = { kind: 'null' };
