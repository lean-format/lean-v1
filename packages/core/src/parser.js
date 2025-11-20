/**
 * @license
 * Copyright (c) 2025 LEAN Format Team and contributors
 * Licensed under MIT License
 */

/**
 * LEAN Format Parser - Reference Implementation
 * Version: 1.0.0
 *
 * A complete parser for the LEAN (Lightweight Efficient Adaptive Notation) format.
 * Converts LEAN text to JavaScript objects (JSON-compatible).
 * @module parser
 */

export class LeanParser {
    constructor(options = {}) {
        this.strict = options.strict || false;
        this.preserveComments = options.preserveComments || false;
        this.input = '';
        this.lines = [];
        this.currentLine = 0;
        this.indentSize = null;
        this.indentChar = null;
    }

    /**
     * Main parse method
     */
    parse(input) {
        this.input = input;
        this.lines = this.normalizeLines(input);
        this.currentLine = 0;
        this.indentSize = null;
        this.indentChar = null;

        const result = this.parseDocument();

        if (this.currentLine < this.lines.length) {
            this.error('Unexpected content after end of document');
        }

        return result;
    }

    /**
     * Normalize line endings and split into lines
     */
    normalizeLines(input) {
        return input
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((line, idx) => ({
                text: line,
                number: idx + 1,
                indent: this.getIndent(line),
                content: line.trim()
            }));
    }

    /**
     * Get indentation level and validate consistency
     */
    getIndent(line) {
        const match = line.match(/^(\s*)/);
        if (!match) return 0;

        const whitespace = match[1];
        if (whitespace.length === 0) return 0;

        // Detect indentation character on first indent
        if (this.indentChar === null) {
            this.indentChar = whitespace[0];
            if (this.indentChar === ' ') {
                // Detect 2-space or 4-space
                const spaces = whitespace.length;
                this.indentSize = spaces <= 2 ? 2 : 4;
            } else if (this.indentChar === '\t') {
                this.indentSize = 1;
            }
        }

        // Validate consistent indentation
        for (let i = 0; i < whitespace.length; i++) {
            if (whitespace[i] !== this.indentChar) {
                this.error('Mixed indentation (spaces and tabs)', this.currentLine);
            }
        }

        return whitespace.length / (this.indentSize || 1);
    }

    /**
     * Parse entire document
     */
    parseDocument() {
        const result = {};

        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];

            // Skip empty lines and comments
            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }

            // Top-level items must have 0 indent
            if (line.indent !== 0) {
                this.error('Unexpected indentation at document root');
            }

            const item = this.parseItem(0);
            this.mergeIntoResult(result, item);
        }

        return result;
    }

    /**
     * Merge parsed item into result, handling deep nesting
     */
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
                // Last value wins - don't check for duplicates
                result[key] = value;
            }
        }
    }

    /**
     * Parse a single item (key-value pair, list, or row list)
     */
    parseItem(expectedIndent) {
        const line = this.lines[this.currentLine];
        if (!line) {
            return null;
        }

        // Handle row syntax (e.g., "users(id, name):" or "blog.posts(id, name):")
        // Updated to support dot notation in row syntax keys
        const rowMatch = line.content.match(/^([a-zA-Z_$][-a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][-a-zA-Z0-9_$]*)*)\s*\(\s*([^)]+)\s*\)\s*:\s*$/);
        if (rowMatch) {
            const key = rowMatch[1].trim();
            const columns = rowMatch[2].split(',').map(col => col.trim());
            this.currentLine++;

            // Parse rows with the same or greater indentation
            const rows = [];
            while (this.currentLine < this.lines.length) {
                const nextLine = this.lines[this.currentLine];

                // Skip empty lines and comments
                if (!nextLine.content || nextLine.content.startsWith('#')) {
                    this.currentLine++;
                    continue;
                }

                if (nextLine.indent <= expectedIndent) break;

                if (nextLine.content.trim().startsWith('-')) {
                    const rowText = nextLine.content.substring(nextLine.content.indexOf('-') + 1).trim();
                    const rowValues = this.parseRowValues(rowText);

                    // Validate row value count in strict mode
                    if (this.strict && rowValues.length > columns.length) {
                        this.error(`Row has ${rowValues.length} values but header defines ${columns.length} columns`);
                    }

                    const row = {};
                    columns.forEach((col, idx) => {
                        row[col] = idx < rowValues.length ? rowValues[idx] : null;
                    });
                    rows.push(row);
                    this.currentLine++;
                } else {
                    break;
                }
            }

            // Handle dot notation in row syntax keys
            if (key.includes('.')) {
                const keys = key.split('.');
                let result = rows;

                // Create nested objects for dot notation keys
                for (let i = keys.length - 1; i >= 0; i--) {
                    const currentKey = keys[i];
                    result = { [currentKey]: result };
                }

                return result;
            }

            return { [key]: rows };
        }

        // Handle key-value pair (including dot notation and special characters in keys)
        // Updated regex to properly handle dots in keys
        const kvMatch = line.content.match(/^([a-zA-Z_$][-a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][-a-zA-Z0-9_$]*)*)\s*:\s*(.*)$/);
        if (!kvMatch) {
            this.error('Expected key-value pair or row syntax');
        }

        const key = kvMatch[1].trim();
        const valueText = kvMatch[2].trim();
        this.currentLine++;

        // Parse the value
        let value;
        if (valueText) {
            value = this.parseValue(valueText);
        } else {
            // Handle multi-line value
            const nextLine = this.lines[this.currentLine];
            if (nextLine && nextLine.indent > expectedIndent) {
                if (nextLine.content.trim().startsWith('-')) {
                    value = this.parseList(expectedIndent + 1);
                } else {
                    value = this.parseObject(expectedIndent + 1);
                }
            } else {
                value = null;
            }
        }

        // Handle dot notation in keys by creating nested objects
        if (key.includes('.')) {
            const keys = key.split('.');
            let result = value;

            // Create nested objects for dot notation keys
            for (let i = keys.length - 1; i >= 0; i--) {
                const currentKey = keys[i];
                result = { [currentKey]: result };
            }

            return result;
        }

        return { [key]: value };
    }

    /**
     * Parse an object (collection of key-value pairs)
     */
    parseObject(expectedIndent) {
        const result = {};

        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];

            // Skip empty lines and comments
            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }

            if (line.indent < expectedIndent) break;
            if (line.indent > expectedIndent) {
                this.error('Unexpected indentation increase');
            }

            const item = this.parseItem(expectedIndent);
            if (item) {
                this.mergeIntoResult(result, item);
            }
        }

        return result;
    }

    /**
     * Parse a list (items starting with -)
     */
    parseList(expectedIndent) {
        const result = [];

        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];

            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }

            if (line.indent < expectedIndent) {
                break;
            }

            if (line.indent > expectedIndent) {
                // In row syntax, we allow indentation for better readability
                if (!line.content.trim().startsWith('-')) {
                    break;
                }
            }

            if (!line.content.trim().startsWith('-')) {
                break;
            }

            const itemText = line.content.substring(line.content.indexOf('-') + 1).trim();
            this.currentLine++;

            // Check if this is a nested object or array
            if (this.currentLine < this.lines.length &&
                this.lines[this.currentLine].indent > expectedIndent) {
                // Check if the next line is a key-value pair (indented with a key)
                const nextLine = this.lines[this.currentLine];
                const kvMatch = nextLine.content.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/);

                if (kvMatch) {
                    // It's a nested object
                    const obj = this.parseObject(expectedIndent + 1);
                    result.push(obj);
                } else if (nextLine.content.trim().startsWith('-')) {
                    // It's a nested list
                    const list = this.parseList(expectedIndent + 1);
                    result.push(list);
                } else {
                    // Simple value after dash
                    const value = this.parseValue(itemText);
                    result.push(value);
                }
            } else {
                // It's a simple value
                const value = this.parseValue(itemText);
                result.push(value);
            }
        }

        return result;
    }

    /**
     * Parse comma-separated row values
     */
    parseRowValues(text) {
        if (!text) return [];

        const values = [];
        let current = '';
        let inQuotes = false;
        let escaped = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (escaped) {
                current += this.unescapeChar(char);
                escaped = false;
                continue;
            }

            if (char === '\\' && inQuotes) {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ',' && !inQuotes) {
                values.push(this.parseValue(current.trim()));
                current = '';
                continue;
            }

            current += char;
        }

        if (current.trim()) {
            values.push(this.parseValue(current.trim()));
        }

        return values;
    }

    /**
     * Parse a single value
     */
    parseValue(text) {
        if (!text) return null;

        // Handle inline comments
        const commentIndex = text.indexOf(' #');
        if (commentIndex !== -1) {
            text = text.substring(0, commentIndex).trim();
            if (!text) return null;
        }

        // Quoted string
        if (text.startsWith('"') && text.endsWith('"')) {
            return this.parseQuotedString(text);
        }

        // Boolean
        if (text === 'true') return true;
        if (text === 'false') return false;

        // Null
        if (text === 'null') return null;

        // Number
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) {
            return parseFloat(text);
        }

        // Unquoted string
        return text;
    }

    /**
     * Parse quoted string with escape sequences
     */
    parseQuotedString(text) {
        let result = '';
        let escaped = false;

        // Remove surrounding quotes
        text = text.slice(1, -1);

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (escaped) {
                result += this.unescapeChar(char);
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            result += char;
        }

        return result;
    }

    /**
     * Unescape character
     */
    unescapeChar(char) {
        const escapes = {
            'n': '\n',
            'r': '\r',
            't': '\t',
            '\\': '\\',
            '"': '"'
        };
        return escapes[char] || char;
    }

    /**
     * Throw error with line information
     */
    error(message, lineNum = null) {
        const line = lineNum !== null ? lineNum : this.lines[this.currentLine]?.number || 'unknown';
        throw new Error(`LEAN Parse Error at line ${line}: ${message}`);
    }
}