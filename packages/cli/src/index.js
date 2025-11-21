#!/usr/bin/env node

/**
 * LEAN CLI Tool
 * Command-line utility for converting between LEAN and JSON formats
 */

const fs = require('fs');
const path = require('path');

let coreModule;
try {
    coreModule = require('@lean/core');
} catch (error) {
    coreModule = require('../../core/src');
}

const { parse, format, validate: validateInput } = coreModule;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Read content from stdin
 * @returns {Promise<string>} Content from stdin
 */
function readStdin() {
    return new Promise((resolve, reject) => {
        let data = '';

        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            resolve(data);
        });
        process.stdin.on('error', reject);
    });
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
  cat data.lean | lean parse              # Parse from stdin
  lean format data.json --output=out.lean # Format as LEAN
  echo '{"name":"Alice"}' | lean format   # Format from stdin
  lean convert input.lean output.json     # Auto-convert
  lean validate data.lean --strict        # Validate with strict mode
  lean watch data.lean                    # Auto-convert on changes
  lean init sample                        # Create sample.lean
  
  # Unix piping examples:
  cat data.lean | lean parse | jq .name   # Parse and extract field
  curl api.com/data | lean format         # Format API response

MORE INFO:
  Repository: https://github.com/lean-format/lean-js
  Docs: https://leanformat.org
  Spec: https://leanformat.org/spec
`);
}

async function parseFile(filepath, options) {
    try {
        let content;

        // Read from stdin if no filepath provided
        if (!filepath) {
            content = await readStdin();
        } else {
            content = fs.readFileSync(filepath, 'utf8');
        }

        const result = parse(content, { strict: options.strict });

        const output = options.pretty
            ? JSON.stringify(result, null, 2)
            : JSON.stringify(result);

        if (options.output) {
            fs.writeFileSync(options.output, output);
            if (!options.quiet) {
                const source = filepath || 'stdin';
                console.log(`✓ Parsed ${source} → ${options.output}`);
            }
        } else {
            console.log(output);
        }
    } catch (error) {
        const source = filepath || 'stdin';
        console.error(`✗ Error parsing ${source}:`);
        console.error(`  ${error.message}`);
        process.exit(1);
    }
}

async function formatFile(filepath, options) {
    try {
        let content;

        // Read from stdin if no filepath provided
        if (!filepath) {
            content = await readStdin();
        } else {
            content = fs.readFileSync(filepath, 'utf8');
        }

        const obj = JSON.parse(content);

        const indent = options.indent === 'tab' ? '\t' : ' '.repeat(parseInt(options.indent || 2));
        const result = format(obj, {
            indent,
            useRowSyntax: options.useRowSyntax !== false
        });

        if (options.output) {
            fs.writeFileSync(options.output, result);
            if (!options.quiet) {
                const source = filepath || 'stdin';
                console.log(`✓ Formatted ${source} → ${options.output}`);
            }
        } else {
            console.log(result);
        }
    } catch (error) {
        const source = filepath || 'stdin';
        console.error(`✗ Error formatting ${source}:`);
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
        const result = validateInput(content, { strict: options.strict });

        if (result.valid) {
            console.log(`✓ ${filepath} is valid LEAN format`);
            if (options.strict) {
                console.log('  (strict mode enabled)');
            }
        } else {
            console.error(`✗ ${filepath} is invalid:`);
            result.errors.forEach(err => {
                console.error(`  Line ${err.line || '?'}: ${err.message}`);
            });
            process.exit(1);
        }
    } catch (error) {
        console.error(`✗ ${filepath} is invalid:`);
        console.error(`  ${error.message}`);
        process.exit(1);
    }
}


function watchFile(filepath, options) {
    const chokidar = require('chokidar');

    console.log(`👀 Watching ${filepath} for changes...`);
    console.log('   Press Ctrl+C to stop');

    const ext = path.extname(filepath).toLowerCase();
    const outputExt = ext === '.lean' ? '.json' : '.lean';
    const outputFile = filepath.replace(new RegExp(`${ext.replace('.', '\\.')}$`), outputExt);

    // Create watcher with chokidar for better cross-platform support
    const watcher = chokidar.watch(filepath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50
        }
    });

    watcher.on('change', async () => {
        try {
            if (ext === '.lean') {
                await parseFile(filepath, { ...options, output: outputFile, pretty: true, quiet: true });
            } else {
                await formatFile(filepath, { ...options, output: outputFile, quiet: true });
            }
            console.log(`✓ ${new Date().toLocaleTimeString()} - Converted ${filepath} → ${outputFile}`);
        } catch (error) {
            console.error(`✗ ${new Date().toLocaleTimeString()} - Error: ${error.message}`);
        }
    });

    watcher.on('error', error => {
        console.error(`✗ Watcher error: ${error.message}`);
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
    - 1, Alice, "alice@example.com", 30
    - 2, Bob, "bob@example.com", 25
    - 3, Casey, "casey@example.com", 28

# Tasks with nested structure
blog:
    title: "My Blog"
    author:
        name: Alice
        email: "alice@example.com"
    posts(id, title, content):
        - 1, "First Post", "Hello, world!"
        - 2, "Second Post", "Another post"
    tags:
        - tech
        - programming
        - blog

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

async function main() {
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
            // Support stdin: if no file provided and stdin is available
            if (files.length === 0 && !process.stdin.isTTY) {
                await parseFile(null, options);
            } else if (files.length === 0) {
                console.error('✗ Error: No input file specified');
                console.error('  Usage: lean parse <file.lean>');
                console.error('  Or pipe input: cat file.lean | lean parse');
                process.exit(1);
            } else {
                await parseFile(files[0], options);
            }
            break;

        case 'format':
            // Support stdin: if no file provided and stdin is available
            if (files.length === 0 && !process.stdin.isTTY) {
                await formatFile(null, options);
            } else if (files.length === 0) {
                console.error('✗ Error: No input file specified');
                console.error('  Usage: lean format <file.json>');
                console.error('  Or pipe input: cat file.json | lean format');
                process.exit(1);
            } else {
                await formatFile(files[0], options);
            }
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

module.exports = { main };


