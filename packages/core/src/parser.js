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
      Object.assign(result, item);
    }

    return result;
  }

  /**
   * Parse a single item (key-value pair, list, or row list)
   */
  parseItem(expectedIndent) {
    const line = this.lines[this.currentLine];

    if (!line || line.indent !== expectedIndent) {
      return null;
    }

    // Skip comments
    if (line.content.startsWith('#')) {
      this.currentLine++;
      return this.parseItem(expectedIndent);
    }

    // Check for row syntax: key(col1, col2):
    const rowMatch = line.content.match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*\(([^)]+)\)\s*:$/);
    if (rowMatch) {
      const key = rowMatch[1];
      const columns = rowMatch[2].split(',').map(c => c.trim());
      this.currentLine++;
      const rows = this.parseRows(expectedIndent + 1, columns);
      return { [key]: rows };
    }

    // Check for key-value pair
    const kvMatch = line.content.match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*:\s*(.*)$/);
    if (!kvMatch) {
      this.error('Expected key-value pair or row syntax');
    }

    const key = kvMatch[1];
    const valueText = kvMatch[2];
    this.currentLine++;

    // Inline value
    if (valueText) {
      const value = this.parseValue(valueText);
      return { [key]: value };
    }

    // Value on next line (object or list)
    const nextLine = this.lines[this.currentLine];
    if (!nextLine || nextLine.indent <= expectedIndent) {
      // Empty value
      return { [key]: null };
    }

    // Check if it's a list
    if (nextLine.content.startsWith('-')) {
      const list = this.parseList(expectedIndent + 1);
      return { [key]: list };
    }

    // Otherwise it's an object
    const obj = this.parseObject(expectedIndent + 1);
    return { [key]: obj };
  }

  /**
   * Parse an object (collection of key-value pairs)
   */
  parseObject(expectedIndent) {
    const result = {};

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
        this.error('Unexpected indentation');
      }

      const item = this.parseItem(expectedIndent);
      if (item) {
        // Check for duplicate keys in strict mode
        const newKey = Object.keys(item)[0];
        if (this.strict && result.hasOwnProperty(newKey)) {
          this.error(`Duplicate key: ${newKey}`);
        }
        Object.assign(result, item);
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
        this.error('Unexpected indentation in list');
      }

      if (!line.content.startsWith('-')) {
        break;
      }

      const valueText = line.content.substring(1).trim();
      this.currentLine++;

      // Inline value
      if (valueText) {
        const value = this.parseValue(valueText);
        result.push(value);
        continue;
      }

      // Multi-line object
      const nextLine = this.lines[this.currentLine];
      if (nextLine && nextLine.indent > expectedIndent) {
        const obj = this.parseObject(expectedIndent + 1);
        result.push(obj);
      } else {
        result.push(null);
      }
    }

    return result;
  }

  /**
   * Parse rows with header tuple
   */
  parseRows(expectedIndent, columns) {
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
        this.error('Unexpected indentation in row list');
      }

      if (!line.content.startsWith('-')) {
        break;
      }

      const rowText = line.content.substring(1).trim();
      this.currentLine++;

      // Parse comma-separated values
      const values = this.parseRowValues(rowText);

      // Check for extra values
      if (values.length > columns.length) {
        if (this.strict) {
          this.error(`Row has ${values.length} values but header defines ${columns.length} columns`);
        }
        // In loose mode, truncate extra values
        values.length = columns.length;
      }

      // Create object from columns and values
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = idx < values.length ? values[idx] : null;
      });

      result.push(obj);
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


