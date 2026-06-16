# Changelog

All notable changes to the LEAN Format project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Python reference implementation (`src/lean/` in oneroute) with:
  - Inline objects/arrays value syntax (`{a: 1}`, `[1, 2]`)
  - Dot-notation expansion (`ParseOptions(expand_dot_notation=True)`)
  - Dots in key names (`com.example.key: value`)
  - Dash-only list items (bare `-` with indented children)
  - WebSocket codec for compact location encoding
  - `LeanResponse` / `LeanableResponse` HTTP helpers
  - Contract schema validation (<code>contracts/*.lean</code>)

## [2.0.0] - 2026-06-14

### Added
- **Dual Parser Architecture**
  - Rust/WASM high-performance parser with automatic JS fallback
  - WASM lazy initialization on first `parse()` call
  - Pure TypeScript parser for environments without WASM support

- **Error Codes**
  - 16 structured error codes (`ErrorCode` enum) for programmatic handling
  - `LeanParseError` class with `code`, `message`, `line`, `column`, `snippet`, `suggestion`
  - `LeanSerializeError` class for serialization errors

- **DoS Protection**
  - `maxDepth` option (default 100) prevents stack overflow on deeply nested input
  - `maxInputSize` option (default unlimited) limits input size

- **CLI Enhancements**
  - `lean compile` outputs JSON, YAML, and TOML
  - `lean diff` compares two LEAN files
  - `lean query` queries data by dot-notation path
  - `lean schema` generates and validates schemas
  - `lean init` creates sample `.lean` files
  - `--quiet` flag for machine-readable output

- **Language Server Protocol**
  - Full LSP implementation with hover, completion, and document symbols
  - `@lean-format/language-server` npm package

- **VS Code Extension**
  - 6 user-configurable settings (indent size, row syntax, row threshold, sort keys, dot notation, strict validation)
  - Format options read from `vscode.workspace.getConfiguration`
  - `lean.validate.strict` setting wired into diagnostics

- **Playground**
  - Full interactive playground with YAML/TOML output, schema panel
  - Dark mode with localStorage persistence
  - Keyboard shortcuts (Ctrl+Enter, Ctrl+D)
  - Lite playground on website with real-time conversion
  - Accessibility: ARIA labels, keyboard navigation, error live regions
  - WASM support via `vite-plugin-wasm`

- **Infrastructure**
  - npm provenance for published packages
  - ESLint v9 flat config
  - Coverage reporting with `@vitest/coverage-v8`
  - Security audit in CI (`npm audit` + `cargo audit`)
  - TypeDoc API documentation config
  - 146 passing tests, 0 lint errors, 0 type errors

### Changed
- Dot notation is opt-in (`useDotNotation: false`) — emits `console.warn` when enabled
- Schema validation accumulates all errors instead of early-returning
- CLI parse output defaults to quiet mode for piping
- `@lean/website` updated to Next.js 15 with app router
- Monorepo restructured with clearer package boundaries

### Fixed
- Parser handles blank lines between sibling items
- JS parser inline objects/arrays (`{}`/`[]`)
- List-of-objects detection uses `isKeyValuePair` instead of fragile `nextPeek`
- Wildcard query chaining (`[*].key`) reference-equality bug
- CLI workspace test isolation with `beforeEach`/`afterEach`

## [1.0.0] - 2025-11-21

### Added
- **Core Library (@lean-format/core)**
  - Complete LEAN parser with Lexer/Parser architecture
  - Comprehensive serializer with row syntax support
  - Schema validation system (JSON Schema-like)
  - TypeScript type definitions
  - 94% test coverage (175 tests)
  - Support for dot notation, row syntax, and all LEAN features

- **CLI Tool (@lean-format/cli)**
  - Parse, format, validate, and convert commands
  - Unix-style stdin/stdout piping support
  - Cross-platform watch mode with chokidar
  - Interactive init command for sample files

- **VS Code Extension**
  - Full syntax highlighting for .lean files
  - Document formatting support
  - Real-time validation
  - Convert to JSON command
  - Code snippets

- **Infrastructure**
  - Monorepo structure with npm workspaces
  - Changesets for version management
  - Comprehensive CI/CD with GitHub Actions
  - Documentation (README, SPEC, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
  - Issue templates for bugs and feature requests

### Changed
- Restructured from standalone package to monorepo
- Migrated VS Code extension to use @lean-format/core library
- Enhanced test suite with comprehensive coverage

### Fixed
- Parser handling of mixed indentation
- Inline comment parsing
- Row syntax edge cases
- Deep nested object merging

---

## Release Process

This project uses [changesets](https://github.com/changesets/changesets) for version management.

### Creating a changeset
```bash
npm run changeset
```

### Versioning packages
```bash
npm run version
```

### Publishing
```bash
npm run release
```

---

[Unreleased]: https://github.com/lean-format/lean-v1/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/lean-format/lean-v1/releases/tag/v2.0.0
[1.0.0]: https://github.com/lean-format/lean-v1/releases/tag/v1.0.0
