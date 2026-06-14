# Language Server Protocol (LSP) Support

The LEAN format language server provides IDE features for any editor that supports LSP.

## Features

- **Hover**: Shows key name and type information on hover
- **Completion**: Suggests `true`, `false`, `null` for values and known keys from the document
- **Document Symbols**: Lists top-level keys in the current document for quick navigation
- **Diagnostics**: Real-time error reporting as you type (when used via VS Code extension)

## Installation

### Via VS Code

Install the [LEAN Format Support](https://marketplace.visualstudio.com/items?itemName=lean-format.lean-format) extension from the marketplace.

### Standalone (for other editors)

```bash
npm install -g @lean-format/language-server
```

Then configure your editor to use `lean-language-server` as an LSP server.

## Configuration

### VS Code Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `lean.format.indentSize` | `2` | Spaces per indent level (2 or 4) |
| `lean.format.useRowSyntax` | `true` | Use row syntax for arrays of objects |
| `lean.format.rowThreshold` | `4` | Min items to trigger row syntax |
| `lean.format.sortKeys` | `false` | Sort keys alphabetically on format |
| `lean.format.useDotNotation` | `false` | Use dot notation for nested keys |
| `lean.validate.strict` | `false` | Enable strict validation |

## Protocol Support

- `textDocument/hover` — Returns key documentation
- `textDocument/completion` — Returns value suggestions and known keys
- `textDocument/documentSymbol` — Returns top-level key symbols
