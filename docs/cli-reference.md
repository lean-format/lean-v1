# LEAN CLI Reference

## Overview

The `lean` CLI provides tools for parsing, formatting, validating, and manipulating LEAN format files.

## Global Options

- `--version` — Show version
- `--help` — Show help

## Commands

### `lean parse [file]`

Parse a LEAN file to JSON.

| Option | Description |
|--------|-------------|
| `--strict` | Enable strict mode (duplicate key detection) |
| `-o, --output <file>` | Write to file instead of stdout |
| `--pretty` | Pretty-print JSON |
| `-q, --quiet` | Suppress info messages |

**Examples:**
```bash
lean parse config.lean
lean parse --strict --pretty config.lean
cat config.lean | lean parse
```

### `lean format [file]`

Format JSON as LEAN. Reads JSON from stdin or file.

| Option | Description |
|--------|-------------|
| `--indent <n>` | Spaces: 2, 4, or `tab` (default: 2) |
| `--no-row-syntax` | Disable compact row syntax |
| `--row-threshold <n>` | Min items for row syntax (default: 4) |
| `--sort-keys` | Sort keys alphabetically |
| `-o, --output <file>` | Write to file |
| `-q, --quiet` | Suppress info messages |

**Examples:**
```bash
cat data.json | lean format
lean format --indent 4 input.json
curl api.example.com/data | lean format --sort-keys > output.lean
```

### `lean validate [file]`

Validate LEAN syntax.

| Option | Description |
|--------|-------------|
| `--strict` | Enable strict mode |
| `-q, --quiet` | Suppress info messages |

Exit code: 0 if valid, 1 if invalid.

**Examples:**
```bash
lean validate config.lean
lean validate --strict config.lean
cat config.lean | lean validate
```

### `lean compile [file]`

Compile LEAN to JSON, YAML, TOML, and/or `.env` files.

| Option | Description |
|--------|-------------|
| `--strict` | Enable strict mode |
| `--format <formats>` | Comma-separated: `json,yaml,toml,env` (default: all) |
| `-d, --output-dir <dir>` | Output directory |
| `--force` | Overwrite existing files without prompting |
| `-q, --quiet` | Suppress info messages |

**Examples:**
```bash
lean compile config.lean
lean compile --format json,yaml config.lean
lean compile --format env --force config.lean
```

### `lean diff <file1> <file2>`

Show structural differences between two LEAN files.

**Examples:**
```bash
lean diff before.lean after.lean
```

### `lean query <file> <path>`

Query a LEAN file using dot-separated path syntax.

| Option | Description |
|--------|-------------|
| `--pretty` | Pretty-print JSON output |

**Examples:**
```bash
lean query config.lean server.port
lean query users.lean 'users[0].name'
```

### `lean schema <file>`

Generate JSON Schema from sample LEAN data.

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Write to file |
| `-q, --quiet` | Suppress info messages |

### `lean init [name]`

Create a sample `.lean` file for getting started.

**Examples:**
```bash
lean init
lean init my-config.lean
```

### `lean sql <query> [files...]`

Run SQL queries on `.lean` files using an in-memory SQLite database.

| Option | Description |
|--------|-------------|
| `--format <fmt>` | Output format: `json` (default) or `lean` |
| `--pretty` | Pretty-print JSON output |

Rules:
- Arrays of objects become SQL tables (e.g., `users(id, name)` becomes a `users` table)
- Table names are sanitized (special chars → `_`)
- All columns are `TEXT` type
- Row syntax data is parsed as comma-separated values

**Examples:**
```bash
lean sql "SELECT name FROM users" data.lean
lean sql "SELECT * FROM users WHERE role = 'admin'" data.lean --format lean
lean sql "SELECT COUNT(*) as cnt FROM products"
```

### `lean watch [files...]`

Watch `.lean` files for changes and emit incremental diffs.

| Option | Description |
|--------|-------------|
| `--format <fmt>` | Output: `text` (default) or `json` |
| `--serve <port>` | Start SSE HTTP server on port |
| `--debounce <ms>` | Debounce interval (default: 200) |
| `-q, --quiet` | Suppress info messages |

**Examples:**
```bash
lean watch config.lean
lean watch *.lean --format json
lean watch data.lean --serve 3000
```

### `lean fuzz`

Property-based fuzz testing of the parser/serializer. Generates random LEAN documents and verifies:
- `format → parse` round-trips (deep equality)
- `parse → format → parse` round-trips
- `format` idempotency (`format(format(x)) === format(x)`)

| Option | Description |
|--------|-------------|
| `-n, --iterations <n>` | Number of fuzz iterations (default: 10000) |
| `--seed <n>` | Random seed for reproducing failures |
| `-q, --quiet` | JSON output for machine processing |

**Examples:**
```bash
lean fuzz
lean fuzz -n 1000
lean fuzz -n 100000 --seed 42 -q
```

### `lean migrate <subcommand>`

Schema evolution tool using up/down LEAN scripts.

#### Subcommands

- `create <name>` — Create a new migration file in `migrations/`
- `up` — Apply all pending migrations
- `down` — Roll back the last migration
- `status` — Show which migrations are applied

| Option | Description |
|--------|-------------|
| `--dir <path>` | Migrations directory (default: `migrations`) |
| `-q, --quiet` | Suppress output |

**Examples:**
```bash
lean migrate create add_users_table
lean migrate status
lean migrate up
lean migrate down
```

### `lean repl`

Interactive REPL for exploring LEAN format. Commands:

| Command | Description |
|---------|-------------|
| `.help` | Show help |
| `.exit` / `.quit` | Exit |
| `.load <file>` | Load a `.lean` file |
| `.save <file>` | Save current context |
| `.dump` | Show context as JSON |
| `.validate` | Validate current context |
| `.query <path>` | Query a dot-separated path |
| `.diff <file>` | Diff against another file |
| `.stats` | Show data statistics |
| `.clear` | Clear context |

**Examples:**
```bash
lean repl
lean repl my-config.lean
```

### `lean publish <files...>`

Publish `.lean` files to a local registry.

| Option | Description |
|--------|-------------|
| `--registry <dir>` | Registry directory (default: `.lean-registry`) |
| `--force` | Overwrite existing published files |
| `-q, --quiet` | Suppress output |

### `lean pull <registry>`

Pull `.lean` files from a registry.

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing local files |
| `-q, --quiet` | Suppress output |

## Unix Piping

LEAN CLI is designed for Unix pipes:

```bash
cat data.lean | lean parse | jq .name
curl api.example.com/data.json | lean format
lean parse config.lean | jq '.users[] | select(.role == "admin")'
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (parse failure, validation error, etc.) |
