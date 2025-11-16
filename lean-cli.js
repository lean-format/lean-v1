#!/usr/bin/env node

/**
 * LEAN CLI Tool
 * Command-line utility for converting between LEAN and JSON formats
 * 
 * Usage:
 *   lean parse <file.lean>              # Parse LEAN to JSON
 *   lean format <file.json>             # Format JSON as LEAN
 *   lean convert <input> <output>       # Auto-detect and convert
 *   lean validate <file.lean>           # Validate LEAN syntax
 *   lean watch <file>                   # Watch and auto-convert
 *   lean init                           # Create sample LEAN file
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// LEAN PARSER (embedded)
// ============================================================================

class LeanParser {
    constructor(options = {}) {
        this.strict = options.strict || false;
        this.input = '';
        this.lines = [];
        this.currentLine = 0;
        this.indentSize = null;
        this.indentChar = null;
    }

    parse(input) {
        this.input = input;
        this.lines = this.normalizeLines(input);
        this.currentLine = 0;
        this.indentSize = null;
        this.indentChar = null;
        return this.parseDocument();
    }

    normalizeLines(input) {
        return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
            .map((line, idx) => ({
                text: line,
                number: idx + 1,
                indent: this.getIndent(line),
                content: line.trim()
            }));
    }

    getIndent(line) {
        const match = line.match(/^(\s*)/);
        if (!match) return 0;
        const whitespace = match[1];
        if (whitespace.length === 0) return 0;
        if (this.indentChar === null) {
            this.indentChar = whitespace[0];
            if (this.indentChar === ' ') {
                const spaces = whitespace.length;
                this.indentSize = spaces <= 2 ? 2 : 4;
            } else if (this.indentChar === '\t') {
                this.indentSize = 1;
            }
        }
        for (let i = 0; i < whitespace.length; i++) {
            if (whitespace[i] !== this.indentChar) {
                this.error('Mixed indentation', this.currentLine);
            }
        }
        return whitespace.length / (this.indentSize || 1);
    }

    parseDocument() {
        const result = {};
        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }
            if (line.indent !== 0) {
                this.error('Unexpected indentation at document root');
            }
            const item = this.parseItem(0);
            Object.assign(result, item);
        }
        return result;
    }

    parseItem(expectedIndent) {
        const line = this.lines[this.currentLine];
        if (!line || line.indent !== expectedIndent) return null;
        if (line.content.startsWith('#')) {
            this.currentLine++;
            return this.parseItem(expectedIndent);
        }
        const rowMatch = line.content.match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*\(([^)]+)\)\s*:$/);
        if (rowMatch) {
            const key = rowMatch[1];
            const columns = rowMatch[2].split(',').map(c => c.trim());
            this.currentLine++;
            const rows = this.parseRows(expectedIndent + 1, columns);
            return { [key]: rows };
        }
        const kvMatch = line.content.match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*:\s*(.*)$/);
        if (!kvMatch) this.error('Expected key-value pair');
        const key = kvMatch[1];
        const valueText = kvMatch[2];
        this.currentLine++;
        if (valueText) {
            return { [key]: this.parseValue(valueText) };
        }
        const nextLine = this.lines[this.currentLine];
        if (!nextLine || nextLine.indent <= expectedIndent) {
            return { [key]: null };
        }
        if (nextLine.content.startsWith('-')) {
            return { [key]: this.parseList(expectedIndent + 1) };
        }
        return { [key]: this.parseObject(expectedIndent + 1) };
    }

    parseObject(expectedIndent) {
        const result = {};
        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }
            if (line.indent < expectedIndent) break;
            if (line.indent > expectedIndent) this.error('Unexpected indentation');
            const item = this.parseItem(expectedIndent);
            if (item) {
                const newKey = Object.keys(item)[0];
                if (this.strict && result.hasOwnProperty(newKey)) {
                    this.error(`Duplicate key: ${newKey}`);
                }
                Object.assign(result, item);
            }
        }
        return result;
    }

    parseList(expectedIndent) {
        const result = [];
        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }
            if (line.indent < expectedIndent) break;
            if (line.indent > expectedIndent) this.error('Unexpected indentation');
            if (!line.content.startsWith('-')) break;
            const valueText = line.content.substring(1).trim();
            this.currentLine++;
            if (valueText) {
                result.push(this.parseValue(valueText));
                continue;
            }
            const nextLine = this.lines[this.currentLine];
            if (nextLine && nextLine.indent > expectedIndent) {
                result.push(this.parseObject(expectedIndent + 1));
            } else {
                result.push(null);
            }
        }
        return result;
    }

    parseRows(expectedIndent, columns) {
        const result = [];
        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];
            if (!line.content || line.content.startsWith('#')) {
                this.currentLine++;
                continue;
            }
            if (line.indent < expectedIndent) break;
            if (line.indent > expectedIndent) this.error('Unexpected indentation');
            if (!line.content.startsWith('-')) break;
            const rowText = line.content.substring(1).trim();
            this.currentLine++;
            const values = this.parseRowValues(rowText);
            if (values.length > columns.length) {
                if (this.strict) {
                    this.error(`Row has ${values.length} values but header defines ${columns.length} columns`);
                }
                values.length = columns.length;
            }
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = idx < values.length ? values[idx] : null;
            });
            result.push(obj);
        }
        return result;
    }

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

    parseValue(text) {
        if (!text) return null;
        if (text.startsWith('"') && text.endsWith('"')) {
            return this.parseQuotedString(text);
        }
        if (text === 'true') return true;
        if (text === 'false') return false;
        if (text === 'null') return null;
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) {
            return parseFloat(text);
        }
        return text;
    }

    parseQuotedString(text) {
        let result = '';
        let escaped = false;
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

    unescapeChar(char) {
        const escapes = { 'n': '\n', 'r': '\r', 't': '\t', '\\': '\\', '"': '"' };
        return escapes[char] || char;
    }

    error(message) {
        const line = this.lines[this.currentLine]?.number || 'unknown';
        throw new Error(`Line ${line}: ${message}`);
    }
}

function toLean(obj, options = {}) {
    const indent = options.indent || '  ';
    const useRowSyntax = options.useRowSyntax !== false;
    const rowThreshold = options.rowThreshold || 3;

    function toLeanValue(value, level = 0) {
        if (value === null) return 'null';
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') {
            if (/[\s,:#\[\]\{\}]/.test(value) || value === 'true' || value === 'false' || value === 'null') {
                return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        if (Array.isArray(value)) return toLeanArray(value, level);
        if (typeof value === 'object') return toLeanObject(value, level);
        return 'null';
    }

    function toLeanArray(arr, level) {
        if (arr.length === 0) return '';
        const prefix = indent.repeat(level + 1);
        if (useRowSyntax && arr.length >= rowThreshold && arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
            const keys = Object.keys(arr[0]);
            const isUniform = arr.every(item => {
                const itemKeys = Object.keys(item);
                return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
            });
            if (isUniform && keys.length > 0) {
                let result = '\n';
                arr.forEach(item => {
                    const values = keys.map(k => toLeanValue(item[k], level + 1));
                    result += `${prefix}- ${values.join(', ')}\n`;
                });
                return result;
            }
        }
        let result = '\n';
        arr.forEach(item => {
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                result += `${prefix}-\n`;
                result += toLeanObject(item, level + 2);
            } else {
                result += `${prefix}- ${toLeanValue(item, level + 1)}\n`;
            }
        });
        return result;
    }

    function toLeanObject(obj, level) {
        const prefix = indent.repeat(level);
        let result = '';
        Object.entries(obj).forEach(([key, value]) => {
            if (useRowSyntax && Array.isArray(value) && value.length >= rowThreshold) {
                const isUniformObjects = value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
                if (isUniformObjects && value.length > 0) {
                    const keys = Object.keys(value[0]);
                    const isUniform = value.every(item => {
                        const itemKeys = Object.keys(item);
                        return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
                    });
                    if (isUniform) {
                        result += `${prefix}${key}(${keys.join(', ')}):\n`;
                        value.forEach(item => {
                            const values = keys.map(k => toLeanValue(item[k], level + 1));
                            result += `${indent.repeat(level + 1)}- ${values.join(', ')}\n`;
                        });
                        return;
                    }
                }
            }
            const valueStr = toLeanValue(value, level);
            if (valueStr.startsWith('\n')) {
                result += `${prefix}${key}:${valueStr}`;
            } else {
                result += `${prefix}${key}: ${valueStr}\n`;
            }
        });
        return result;
    }

    return toLeanObject(obj, 0).trimEnd();
}

// ============================================================================
// CLI FUNCTIONS
// ============================================================================

function showHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    LEAN CLI Tool v1.0                         ║
║        Lightweight Efficient Adaptive Notation                ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  lean <command> [options] [files...]

COMMANDS:
  parse <file.lean>              Parse LEAN file to JSON
  format <file.json>             Format JSON as LEAN
  convert <input> <output>       Auto-detect format and convert
  validate <file.lean>           Validate LEAN syntax
  watch <file>                   Watch file and auto-convert
  init [name]                    Create sample LEAN file
  help                           Show this help message

OPTIONS:
  --strict                       Enable strict mode validation
  --no-row-syntax                Disable row syntax optimization
  --indent=<2|4|tab>            Set indentation (default: 2)
  --output=<file>                Specify output file
  --pretty                       Pretty-print JSON output
  --quiet                        Suppress info messages

EXAMPLES:
  lean parse data.lean                    # Parse to JSON (stdout)
  lean parse data.lean --output=out.json  # Parse to file
  lean format data.json --output=out.lean # Format as LEAN
  lean convert input.lean output.json     # Auto-convert
  lean validate data.lean --strict        # Validate with strict mode
  lean watch data.lean                    # Auto-convert on changes
  lean init sample                        # Create sample.lean

MORE INFO:
  Repository: https://github.com/lean-format/lean
  Docs: https://leanformat.org
  Spec: https://leanformat.org/spec
`);
}

function parseFile(filepath, options) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        const parser = new LeanParser({ strict: options.strict });
        const result = parser.parse(content);
        
        const output = options.pretty 
            ? JSON.stringify(result, null, 2)
            : JSON.stringify(result);
        
        if (options.output) {
            fs.writeFileSync(options.output, output);
            if (!options.quiet) {
                console.log(`✓ Parsed ${filepath} → ${options.output}`);
            }
        } else {
            console.log(output);
        }
    } catch (error) {
        console.error(`✗ Error parsing ${filepath}:`);
        console.error(`  ${error.message}`);
        process.exit(1);
    }
}

function formatFile(filepath, options) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        const obj = JSON.parse(content);
        
        const indent = options.indent === 'tab' ? '\t' : ' '.repeat(parseInt(options.indent || 2));
        const result = toLean(obj, {
            indent,
            useRowSyntax: options.useRowSyntax !== false
        });
        
        if (options.output) {
            fs.writeFileSync(options.output, result);
            if (!options.quiet) {
                console.log(`✓ Formatted ${filepath} → ${options.output}`);
            }
        } else {
            console.log(result);
        }
    } catch (error) {
        console.error(`✗ Error formatting ${filepath}:`);
        console.error(`  ${error.message}`);
        process.exit(1);
    }
}

function convertFile(input, output, options) {
    const inputExt = path.extname(input).toLowerCase();
    const outputExt = path.extname(output).toLowerCase();
    
    if (inputExt === '.lean' && outputExt === '.json') {
        parseFile(input, { ...options, output, pretty: true });
    } else if (inputExt === '.json' && outputExt === '.lean') {
        formatFile(input, { ...options, output });
    } else {
        console.error('✗ Cannot determine conversion direction');
        console.error('  Input must be .lean or .json');
        console.error('  Output must be .json or .lean');
        process.exit(1);
    }
}

function validateFile(filepath, options) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        const parser = new LeanParser({ strict: options.strict });
        parser.parse(content);
        
        console.log(`✓ ${filepath} is valid LEAN format`);
        if (options.strict) {
            console.log('  (strict mode enabled)');
        }
    } catch (error) {
        console.error(`✗ ${filepath} is invalid:`);
        console.error(`  ${error.message}`);
        process.exit(1);
    }
}

function watchFile(filepath, options) {
    console.log(`👀 Watching ${filepath} for changes...`);
    console.log('   Press Ctrl+C to stop');
    
    const ext = path.extname(filepath).toLowerCase();
    const outputExt = ext === '.lean' ? '.json' : '.lean';
    const outputFile = filepath.replace(new RegExp(`${ext}$`), outputExt);
    
    let timeout;
    fs.watch(filepath, (eventType) => {
        if (eventType === 'change') {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                try {
                    if (ext === '.lean') {
                        parseFile(filepath, { ...options, output: outputFile, pretty: true, quiet: true });
                    } else {
                        formatFile(filepath, { ...options, output: outputFile, quiet: true });
                    }
                    console.log(`✓ ${new Date().toLocaleTimeString()} - Converted ${filepath} → ${outputFile}`);
                } catch (error) {
                    console.error(`✗ ${new Date().toLocaleTimeString()} - Error: ${error.message}`);
                }
            }, 100);
        }
    });
}

function initFile(name = 'sample') {
    const filename = name.endsWith('.lean') ? name : `${name}.lean`;
    
    const sample = `# Sample LEAN file
# This demonstrates the LEAN format features

project:
    name: "My Project"
    version: 1.0
    active: true
    tags:
        - demo
        - example
        - lean

# Users with row syntax (compact tabular data)
users(id, name, email, age):
    - 1, Alice, alice@example.com, 30
    - 2, Bob, bob@example.com, 25
    - 3, Casey, casey@example.com, 28

# Tasks with nested structure
tasks:
    - title: "Learn LEAN format"
      status: completed
      priority: high
    - title: "Build something cool"
      status: in_progress
      priority: medium

# Configuration
config:
    debug: false
    timeout: 5000
    features:
        api: true
        cache: true
        logging: false
`;

    try {
        if (fs.existsSync(filename)) {
            console.error(`✗ File ${filename} already exists`);
            process.exit(1);
        }
        
        fs.writeFileSync(filename, sample);
        console.log(`✓ Created ${filename}`);
        console.log(`\nTry these commands:`);
        console.log(`  lean parse ${filename}           # View as JSON`);
        console.log(`  lean validate ${filename}        # Validate syntax`);
        console.log(`  lean convert ${filename} out.json # Convert to JSON`);
    } catch (error) {
        console.error(`✗ Error creating file: ${error.message}`);
        process.exit(1);
    }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
        showHelp();
        return;
    }
    
    // Parse options
    const options = {
        strict: false,
        pretty: false,
        quiet: false,
        useRowSyntax: true,
        indent: '2',
        output: null
    };
    
    const files = [];
    
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            if (key === 'strict') options.strict = true;
            else if (key === 'pretty') options.pretty = true;
            else if (key === 'quiet') options.quiet = true;
            else if (key === 'no-row-syntax') options.useRowSyntax = false;
            else if (key === 'indent') options.indent = value;
            else if (key === 'output') options.output = value;
        } else if (!arg.startsWith('-')) {
            files.push(arg);
        }
    }
    
    const command = files.shift();
    
    switch (command) {
        case 'parse':
            if (files.length === 0) {
                console.error('✗ Error: No input file specified');
                console.error('  Usage: lean parse <file.lean>');
                process.exit(1);
            }
            parseFile(files[0], options);
            break;
            
        case 'format':
            if (files.length === 0) {
                console.error('✗ Error: No input file specified');
                console.error('  Usage: lean format <file.json>');
                process.exit(1);
            }
            formatFile(files[0], options);
            break;
            
        case 'convert':
            if (files.length < 2) {
                console.error('✗ Error: Input and output files required');
                console.error('  Usage: lean convert <input> <output>');
                process.exit(1);
            }
            convertFile(files[0], files[1], options);
            break;
            
        case 'validate':
            if (files.length === 0) {
                console.error('✗ Error: No input file specified');
                console.error('  Usage: lean validate <file.lean>');
                process.exit(1);
            }
            validateFile(files[0], options);
            break;
            
        case 'watch':
            if (files.length === 0) {
                console.error('✗ Error: No input file specified');
                console.error('  Usage: lean watch <file>');
                process.exit(1);
            }
            watchFile(files[0], options);
            break;
            
        case 'init':
            initFile(files[0]);
            break;
            
        default:
            console.error(`✗ Unknown command: ${command}`);
            console.error('  Run "lean help" for usage information');
            process.exit(1);
    }
}

// Run CLI if executed directly
if (require.main === module) {
    main();
}

// Export for testing
module.exports = { LeanParser, toLean };
