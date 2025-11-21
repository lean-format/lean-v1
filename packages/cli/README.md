# @lean/cli

Command-line interface for the LEAN (Lightweight Efficient Adaptive Notation) data format.

## Installation

```bash
npm install -g @lean-format/cli
```

## Usage

### Parse LEAN to JavaScript/JSON

```bash
# From file
lean parse data.lean

# From stdin
cat data.lean | lean parse

# Output to file
lean parse data.lean -o output.json
```

### Format JavaScript/JSON to LEAN

```bash
# From file
lean format data.json

# From stdin
echo '{"name":"Alice","age":30}' | lean format

# Output to file
lean format data.json -o output.lean
```

### Convert between formats

```bash
# LEAN to JSON
lean convert data.lean data.json

# JSON to LEAN
lean convert data.json data.lean
```

### Validate LEAN files

```bash
lean validate data.lean
```

### Watch mode (auto-convert on file changes)

```bash
lean watch data.lean
```

### Initialize a sample LEAN file

```bash
lean init sample
```

## Options

- `-o, --output <file>` - Output file path
- `-p, --pretty` - Pretty print JSON output
- `-s, --strict` - Enable strict mode validation
- `-q, --quiet` - Suppress non-error output

## Examples

### Parse and pipe to jq
```bash
cat config.lean | lean parse | jq '.database.host'
```

### Format with custom output
```bash
lean format api-response.json -o config.lean
```

### Watch and auto-convert
```bash
lean watch config.lean
# Every time config.lean changes, it converts to config.json
```

## Features

- ✅ Unix-style stdin/stdout piping
- ✅ Cross-platform file watching with chokidar
- ✅ Row syntax support for tabular data
- ✅ Comprehensive validation
- ✅ Pretty printing options

## Learn More

- [LEAN Format Specification](https://github.com/lean-format/lean-v1/blob/restruct/SPECIFICATION.md)
- [Report Issues](https://github.com/lean-format/lean-v1/issues)
- [Website](https://lean-format.github.io/lean-v1/)

## License

MIT © LEAN Format Team
