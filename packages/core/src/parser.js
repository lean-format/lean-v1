/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
 */

import { Lexer, TokenType } from './lexer.js';

export class LeanParser {
    constructor(options = {}) {
        this.strict = options.strict || false;
        this.tokens = [];
        this.pos = 0;
    }

    parse(input) {
        const lexer = new Lexer(input);
        this.tokens = lexer.tokenize();
        this.pos = 0;

        const result = this.parseBlock();

        if (this.peek().type !== TokenType.EOF) {
            throw new Error(`Unexpected token after end of document: ${this.peek().type}`);
        }

        return result;
    }

    parseBlock() {
        const obj = {};

        while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.DEDENT) {
            if (this.peek().type === TokenType.INDENT) {
                throw new Error(`Unexpected indentation at document root (or inside block) at line ${this.peek().line}`);
            }
            if (this.peek().type === TokenType.NEWLINE) {
                this.advance();
                continue;
            }

            const item = this.parseItem();
            if (item) {
                this.deepMerge(obj, item);
            }
        }

        return obj;
    }

    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Object && key in target && target[key] instanceof Object && !Array.isArray(target[key]) && !Array.isArray(source[key])) {
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    parseItem() {
        const keyToken = this.peek();

        // Check for list item
        if (keyToken.type === TokenType.HYPHEN) {
            // This shouldn't happen at the block level usually, unless it's a top-level list (not supported by spec but possible)
            // Or if we are inside a list parsing context.
            // However, parseBlock expects key-value pairs.
            // If we encounter a hyphen here, it might be a syntax error or a list value where a key was expected.
            // For now, let's assume blocks are objects.
            throw new Error(`Unexpected list item at line ${keyToken.line}. Expected key.`);
        }

        if (keyToken.type !== TokenType.IDENTIFIER && keyToken.type !== TokenType.STRING) {
            // It might be a comment or something else we skip? Lexer handles comments.
            // If it's EOF or DEDENT, we should have caught it in the loop.
            throw new Error(`Expected key-value pair or row syntax (identifier) at line ${keyToken.line}, found ${keyToken.type}`);
        }

        const key = keyToken.value;
        this.advance();

        // Check for Row Syntax: key(col1, col2):
        if (this.peek().type === TokenType.LPAREN) {
            return this.parseRowList(key);
        }

        // Standard Key-Value: key: value
        if (this.peek().type !== TokenType.COLON) {
            throw new Error(`Expected ':' after key at line ${keyToken.line}`);
        }
        this.advance(); // Skip colon

        const value = this.parseValue();

        // Handle dot notation
        if (typeof key === 'string' && key.includes('.')) {
            return this.expandDotNotation(key, value);
        }

        return { [key]: value };
    }

    parseRowList(key) {
        this.consume(TokenType.LPAREN);
        const columns = [];

        while (this.peek().type !== TokenType.RPAREN) {
            const col = this.consume(TokenType.IDENTIFIER).value;
            columns.push(col);

            if (this.peek().type === TokenType.COMMA) {
                this.advance();
            }
        }
        this.consume(TokenType.RPAREN);
        this.consume(TokenType.COLON);
        if (this.peek().type === TokenType.NEWLINE) {
            this.advance();
        } else if (this.peek().type === TokenType.EOF) {
            // Allow EOF after colon
        } else {
            throw new Error(`Expected NEWLINE or EOF after colon at line ${this.peek().line}`);
        }

        if (this.peek().type === TokenType.INDENT) {
            this.consume(TokenType.INDENT);
        } else {
            // If no indent, maybe empty row list?
            // If EOF, we are done.
            if (this.peek().type === TokenType.EOF) {
                return { [key]: [] };
            }
            // If not indent and not EOF, it's an error or empty list?
            // "users(id):" -> empty list.
            // If next token is not INDENT, we assume empty list.
            return { [key]: [] };
        }

        const rows = [];
        while (this.peek().type === TokenType.HYPHEN) {
            this.advance(); // Skip hyphen
            const row = {};
            const values = [];

            // Parse row values (comma separated)
            // We can't use parseValue() directly because it might consume newlines for objects/lists
            // Row values are simple values on the same line

            while (this.peek().type !== TokenType.NEWLINE && this.peek().type !== TokenType.EOF) {
                values.push(this.parseSimpleValue());
                if (this.peek().type === TokenType.COMMA) {
                    this.advance();
                } else {
                    break;
                }
            }

            // Validate strict mode
            if (this.strict && values.length > columns.length) {
                throw new Error(`Row has ${values.length} values but header defines ${columns.length} columns at line ${this.peek().line}`);
            }

            columns.forEach((col, idx) => {
                row[col] = idx < values.length ? values[idx] : null;
            });
            rows.push(row);

            if (this.peek().type === TokenType.NEWLINE) {
                this.advance();
            }
        }

        this.consume(TokenType.DEDENT);

        // Handle dot notation
        if (typeof key === 'string' && key.includes('.')) {
            return this.expandDotNotation(key, rows);
        }

        return { [key]: rows };
    }

    parseValue() {
        // Check for nested block (Indent)
        if (this.peek().type === TokenType.NEWLINE) {
            this.advance();
            if (this.peek().type === TokenType.INDENT) {
                this.advance();

                // Check if it's a list or an object
                if (this.peek().type === TokenType.HYPHEN) {
                    const list = this.parseList();
                    this.consume(TokenType.DEDENT);
                    return list;
                } else {
                    const obj = this.parseBlock();
                    this.consume(TokenType.DEDENT);
                    return obj;
                }
            } else {
                return null; // Empty value
            }
        }

        if (this.peek().type === TokenType.EOF || this.peek().type === TokenType.DEDENT) {
            return null; // Empty value at end of block/file
        }

        // Simple value on the same line
        return this.parseSimpleValue();
    }

    parseList() {
        const list = [];
        while (this.peek().type === TokenType.HYPHEN) {
            this.advance(); // Skip hyphen

            // Check if it's a complex item (nested object/list)
            if (this.peek().type === TokenType.NEWLINE) {
                this.advance();
                this.consume(TokenType.INDENT);
                if (this.peek().type === TokenType.HYPHEN) {
                    list.push(this.parseList());
                } else {
                    list.push(this.parseBlock());
                }
                this.consume(TokenType.DEDENT);
            } else {
                // Simple value
                list.push(this.parseSimpleValue());
                if (this.peek().type === TokenType.NEWLINE) {
                    this.advance();
                }
            }
        }
        return list;
    }

    parseSimpleValue() {
        const token = this.peek();
        this.advance();

        switch (token.type) {
            case TokenType.STRING:
            case TokenType.NUMBER:
            case TokenType.BOOLEAN:
            case TokenType.NULL:
                return token.value;
            case TokenType.IDENTIFIER:
                return token.value; // Unquoted string
            default:
                throw new Error(`Unexpected token for value: ${token.type} at line ${token.line}`);
        }
    }

    expandDotNotation(key, value) {
        const keys = key.split('.');
        let result = value;

        for (let i = keys.length - 1; i >= 0; i--) {
            result = { [keys[i]]: result };
        }
        return result;
    }

    mergeIntoResult(result, item) {
        for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                if (!result[key]) {
                    result[key] = {};
                }
                if (typeof result[key] === 'object' && !Array.isArray(result[key])) {
                    this.mergeIntoResult(result[key], value);
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = value;
            }
        }
    }

    peek() {
        return this.tokens[this.pos];
    }

    advance() {
        this.pos++;
    }

    consume(type) {
        if (this.peek().type === type) {
            const token = this.peek();
            this.advance();
            return token;
        }
        throw new Error(`Expected ${type} but found ${this.peek().type} at line ${this.peek().line}`);
    }
}