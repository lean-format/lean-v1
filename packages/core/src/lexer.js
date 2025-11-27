/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
 */

export const TokenType = {
    INDENT: 'INDENT',
    DEDENT: 'DEDENT',
    NEWLINE: 'NEWLINE',
    IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    NULL: 'NULL',
    COLON: 'COLON',
    HYPHEN: 'HYPHEN',
    COMMA: 'COMMA',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    EOF: 'EOF'
};

export class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

export class Lexer {
    constructor(input) {
        this.input = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.indentStack = [0];
        this.tokens = [];
        this.indentationHandled = false;
        this.isStartOfLine = true;
        this.indentChar = null;
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.peek();

            // Handle newlines
            if (char === '\n') {
                this.addToken(TokenType.NEWLINE, '\n');
                this.advance();
                this.line++;
                this.column = 1;
                this.indentationHandled = false;
                this.isStartOfLine = true;
                continue;
            }

            // Handle indentation at start of line
            if (this.column === 1 && !this.indentationHandled) {
                this.handleIndentation();
                this.indentationHandled = true;
                if (this.pos >= this.input.length) break;
                // Re-peek after indentation handling as pos might have changed
                continue;
            }

            // Skip whitespace (except newlines)
            if (char === ' ' || char === '\t') {
                this.advance();
                continue;
            }

            // Handle comments
            // Only treat # as comment if it's the first non-whitespace character (handled by handleIndentation check)
            // OR if we are at the start of the line (column 1)
            // But wait, handleIndentation consumes indentation.
            // So if we are here, and char is #, it IS the first non-whitespace char.
            // UNLESS we are in the middle of a line.
            // We need to know if we are at the start of the line (after indentation).
            // We can check if `this.column` equals `indentation + 1`? No.
            // We can check if we just handled indentation?
            // Or simply: The Lexer loop handles tokens.
            // If we see `#`, is it a comment?
            // If inline comments are NOT supported, then `#` is only a comment if it's at the start of the line.
            // But `handleIndentation` skips whitespace.
            // So if `   # comment`, `handleIndentation` runs. `pos` at `#`.
            // Then `char` is `#`.
            // If `key: value # not comment`.
            // `key`, `:`, `value`, ` `. `char` is `#`.
            // Here `column` is NOT at start.
            // So we should treat `#` as a character (part of identifier/string) if it's not at start.

            if (char === '#') {
                // Check if we are at the start of the line (ignoring indentation)
                // We can check if the previous tokens on this line were only INDENT?
                // Or easier: check if `this.column` matches the expected indentation + 1?
                // But we don't track "expected indentation".

                // Actually, `handleIndentation` sets `this.indentationHandled = true`.
                // And `column` > 1.
                // But if we are at the start of the line, we just handled indentation (or column is 1).
                // So if we are at the start, we should skip comment.
                // But if we parsed other tokens on this line, we should NOT skip.

                // We can track `tokensOnLine` count? Reset on NEWLINE.
                // If `tokensOnLine === 0` (ignoring INDENT), then `#` is comment.

                // But wait, `INDENT` is a token.
                // So if `tokensOnLine === 0` or `tokensOnLine === 1` (INDENT).

                // Let's add `tokensOnLine` to Lexer.

                // For now, let's just implement the logic:
                // If char is #, and we are NOT at start of line (meaning we have seen other tokens), treat as symbol?
                // But `handleIndentation` runs first.
                // If `   #`, `handleIndentation` runs. `pos` at `#`.
                // We need to know if we are "at start".

                // Let's use a flag `isStartOfLine`.
                // Set to true on NEWLINE.
                // Set to false when we emit a token (other than INDENT/DEDENT).

                // But `INDENT` is emitted.
                // So if we emit `INDENT`, `isStartOfLine` remains true?
                // Yes, because `#` after indent is still a comment.

                // So:
                // 1. Add `isStartOfLine` flag. Init true.
                // 2. On NEWLINE, set true.
                // 3. On `addToken`: if type is NOT INDENT/DEDENT/NEWLINE/EOF, set false.
                // 4. If `char === '#'`, check `isStartOfLine`.
                //    If true, skip comment.
                //    If false, treat as punctuation/symbol (or part of identifier).

                // Wait, `#` is not in `TokenType`.
                // So if it's not a comment, what is it?
                // It falls through to `readIdentifier` or `readString`?
                // `readIdentifier` regex: `/[a-zA-Z0-9_$.-]/`. `#` is not there.
                // So it throws "Unexpected character".

                // So we need to support `#` in identifiers?
                //            // Handle comments
                if (char === '#') {
                    this.skipComment();
                    continue;
                }    // But we need to ensure `#` is handled.
                // We can add `#` to `isIdentifierPart`?
            }

            // Handle punctuation
            if (char === ':') {
                this.addToken(TokenType.COLON, ':');
                this.advance();
                continue;
            }
            if (char === '-') {
                // Check if it's a negative number or a hyphen
                if (this.isNextDigit()) {
                    this.readNumber();
                } else {
                    this.addToken(TokenType.HYPHEN, '-');
                    this.advance();
                }
                continue;
            }
            if (char === ',') {
                this.addToken(TokenType.COMMA, ',');
                this.advance();
                continue;
            }
            if (char === '(') {
                this.addToken(TokenType.LPAREN, '(');
                this.advance();
                continue;
            }
            if (char === ')') {
                this.addToken(TokenType.RPAREN, ')');
                this.advance();
                continue;
            }

            // Handle strings
            if (char === '"') {
                this.readString();
                continue;
            }

            // Handle numbers
            if (this.isDigit(char)) {
                this.readNumber();
                continue;
            }

            // Handle identifiers and keywords
            if (this.isIdentifierStart(char)) {
                this.readIdentifier();
                continue;
            }

            throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
        }

        // Dedent to zero at EOF
        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            this.addToken(TokenType.DEDENT, '');
        }

        this.addToken(TokenType.EOF, '');
        return this.tokens;
    }

    handleIndentation() {
        let indentLevel = 0;
        // indentChar is initialized in constructor

        // Calculate indentation
        let currentPos = this.pos;
        while (currentPos < this.input.length) {
            const char = this.input[currentPos];
            if (char === ' ' || char === '\t') {
                if (this.indentChar === null) {
                    this.indentChar = char;
                } else if (char !== this.indentChar) {
                    throw new Error(`Mixed indentation (spaces and tabs) at line ${this.line}`);
                }

                if (char === ' ') {
                    indentLevel++;
                } else { // tab
                    indentLevel += 4; // Treat tab as 4 spaces for calculation
                }
            } else {
                break;
            }
            currentPos++;
        }

        // If line is empty or comment-only, ignore indentation
        if (currentPos >= this.input.length || this.input[currentPos] === '\n' || this.input[currentPos] === '#') {
            const indentLength = currentPos - this.pos;
            this.pos = currentPos;
            this.column += indentLength;
            // If it's a comment, skip it, but don't reset column yet as we might be on a new line next
            return;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        if (indentLevel > currentIndent) {
            this.indentStack.push(indentLevel);
            this.addToken(TokenType.INDENT, indentLevel);
        } else if (indentLevel < currentIndent) {
            while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indentLevel) {
                this.indentStack.pop();
                this.addToken(TokenType.DEDENT, '');
            }
            // The old parser logic for mixed indentation is now handled above
            // if (whitespace[i] !== this.indentChar) {
            //     // throw new Error('Mixed indentation (spaces and tabs)', this.currentLine);
            //     // Wait, this logic was in old parser. Lexer handles it differently.
            // }
        }
        // Lexer logic:
        // We need to check consistency in handleIndentation?
        // But handleIndentation just counts spaces/tabs.
        // It doesn't enforce "only spaces" or "only tabs" across the file?
        // The old parser did: `if (whitespace[i] !== this.indentChar)`.
        // My Lexer doesn't track `indentChar` globally yet.

        // I should add `indentChar` tracking to Lexer to support this check.

        // But for now, let's just fix the error message in `handleIndentation` if inconsistent.
        // Wait, `handleIndentation` throws `Inconsistent indentation`.
        // This is when indentation level doesn't match stack.

        // The test expects "Mixed indentation (spaces and tabs)".
        // This implies mixing spaces and tabs in the SAME line or across file.
        // My Lexer treats tab as 4 spaces.
        // It doesn't check for mixed chars.

        // I should implement mixed indentation check.
        // Add `indentChar` to Lexer. Init null.
        // In `handleIndentation`, check first char.
        // If `indentChar` is null, set it.
        // If `indentChar` is set, check if current indentation uses same char.

        // But `handleIndentation` iterates `currentPos`.
        // `char = this.input[currentPos]`.
        // If `char` is space or tab.

        // Let's update `handleIndentation` to check mixed indentation.

        const indentLength = currentPos - this.pos;
        this.pos = currentPos;
        this.column += indentLength;
    }

    skipComment() {
        while (this.pos < this.input.length && this.peek() !== '\n') {
            this.advance();
        }
    }

    readString() {
        let value = '';
        this.advance(); // Skip opening quote

        while (this.pos < this.input.length) {
            const char = this.peek();
            if (char === '"') {
                this.advance(); // Skip closing quote
                this.addToken(TokenType.STRING, value);
                return;
            }
            if (char === '\\') {
                this.advance();
                const escape = this.peek();
                const escapes = { 'n': '\n', 'r': '\r', 't': '\t', '\\': '\\', '"': '"' };
                value += escapes[escape] || escape;
                this.advance();
            } else {
                value += char;
                this.advance();
            }
        }
        throw new Error(`Unterminated string at line ${this.line}`);
    }

    readNumber() {
        let value = '';
        if (this.peek() === '-') {
            value += '-';
            this.advance();
        }

        while (this.pos < this.input.length && (this.isDigit(this.peek()) || this.peek() === '.' || this.peek() === 'e' || this.peek() === 'E')) {
            value += this.peek();
            this.advance();
        }

        this.addToken(TokenType.NUMBER, parseFloat(value));
    }

    readIdentifier() {
        let value = '';
        while (this.pos < this.input.length && this.isIdentifierPart(this.peek())) {
            value += this.peek();
            this.advance();
        }

        if (value === 'true') this.addToken(TokenType.BOOLEAN, true);
        else if (value === 'false') this.addToken(TokenType.BOOLEAN, false);
        else if (value === 'null') this.addToken(TokenType.NULL, null);
        else if (value.includes('.')) {
            // Handle dot notation as a single identifier for now, parser will split
            this.addToken(TokenType.IDENTIFIER, value);
        } else {
            // Treat unquoted strings as identifiers/strings depending on context
            // For now, everything else is an identifier which can be a key or an unquoted string value
            this.addToken(TokenType.IDENTIFIER, value);
        }
    }

    peek() {
        return this.input[this.pos];
    }

    advance() {
        this.pos++;
        this.column++;
    }

    addToken(type, value) {
        this.tokens.push(new Token(type, value, this.line, this.column));
        if (type !== TokenType.INDENT && type !== TokenType.DEDENT && type !== TokenType.NEWLINE && type !== TokenType.EOF) {
            this.isStartOfLine = false;
        }
    }

    isDigit(char) {
        return /[0-9]/.test(char);
    }

    isNextDigit() {
        return this.pos + 1 < this.input.length && this.isDigit(this.input[this.pos + 1]);
    }

    isIdentifierStart(char) {
        return /[a-zA-Z_$]/.test(char);
    }

    isIdentifierPart(char) {
        return char === '#' || /[-a-zA-Z0-9_$.@]/.test(char);
    }
}
