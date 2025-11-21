# LEAN Format Support for VS Code

Syntax highlighting and language support for LEAN (Lightweight Efficient Adaptive Notation) format.

## Features

- **Syntax Highlighting** - Beautiful color coding for LEAN files
- **Snippets** - Quick templates for common patterns
- **Auto-formatting** - Format LEAN files on save
- **Validation** - Check LEAN syntax for errors
- **Code Folding** - Collapse/expand sections

## Syntax Examples

### Row Syntax (Compact Tables)
```lean
users(id, name, email, age):
    - 1, Alice, "alice@example.com", 30
    - 2, Bob, "bob@example.com", 25
```

### Nested Objects
```lean
project:
    name: "My Project"
    version: 1.0
    config:
        debug: false
        timeout: 5000
```

### Lists
```lean
tags:
    - technology
    - programming
    - data
```

## Snippets

Type these prefixes and press Tab:

- `kv` - Key-value pair
- `obj` - Object with nested properties
- `list` - Simple list
- `rows` - Row syntax with header
- `users` - User table template
- `products` - Product catalog template
- `config` - Configuration object

## Commands

- **LEAN: Validate** - Check file syntax
- **LEAN: Convert to JSON** - Info about CLI conversion

## Color Theme Support

The extension provides optimal syntax highlighting for:
- Dark+ (default dark)
- Light+ (default light)
- Monokai
- Solarized
- One Dark Pro
- All popular VS Code themes

## Requirements

- VS Code 1.80.0 or higher

## Extension Settings

This extension contributes the following settings:

- `lean.format.enable`: Enable/disable auto-formatting
- `lean.format.indentSize`: Set indentation size (2 or 4 spaces)

## Installation

### From Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "LEAN Format"
4. Click Install

### From VSIX
```bash
code --install-extension lean-format-1.0.0.vsix
```

## Development

### Building
```bash
npm install
npm run package
```

### Testing
1. Open in VS Code
2. Press F5 to launch Extension Development Host
3. Open a .lean file to test

## Contributing

Contributions are welcome! Please visit:
https://github.com/lean-format/vscode-lean

## License

MIT License - See LICENSE file for details

## More Information

- [LEAN Specification](https://leanformat.org/spec)
- [LEAN CLI Tool](https://github.com/lean-format/lean-cli)
- [Online Playground](https://leanformat.org/playground)

---

**Enjoy working with LEAN format!** ✨
