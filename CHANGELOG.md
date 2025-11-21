# Changelog

All notable changes to the LEAN Format project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-11-21

### Added
- **Core Library (@lean/core)**
  - Complete LEAN parser with Lexer/Parser architecture
  - Comprehensive serializer with row syntax support
  - Schema validation system (JSON Schema-like)
  - TypeScript type definitions
  - 94% test coverage (175 tests)
  - Support for dot notation, row syntax, and all LEAN features

- **CLI Tool (@lean/cli)**
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
- Migrated VS Code extension to use @lean/core library
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

[Unreleased]: https://github.com/lean-format/lean-v1/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lean-format/lean-v1/releases/tag/v1.0.0
