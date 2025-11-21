# LEAN Format

[![npm version](https://badge.fury.io/js/lean-format.svg)](https://www.npmjs.com/package/@lean-format/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**LEAN** (Lightweight Efficient Adaptive Notation) is a minimal, human-readable data interchange format that combines the flexibility of JSON with the compactness of tabular data.

> "It's like JSON and CSV had a baby that was raised by YAML."

## 🌟 Why LEAN?

- **Compact**: Row syntax eliminates key repetition in lists, reducing file size significantly for tabular data.
- **Readable**: Uses natural indentation and minimal syntax, making it easy for humans to read and write.
- **Flexible**: seamlessly adapts between object (key-value) and row (tabular) representations.
- **Simple**: Designed to be easy to parse and generate.

## 🚀 Quick Start

### Installation

```bash
npm install lean-format
```

### Usage

```javascript
import { parse, format } from 'lean-format';

// Parse LEAN to JavaScript
const leanData = `
users(id, name, role):
  - 1, "Alice", "Admin"
  - 2, "Bob", "User"
`;

const data = parse(leanData);
console.log(data);
/* Output:
{
  users: [
    { id: 1, name: "Alice", role: "Admin" },
    { id: 2, name: "Bob", role: "User" }
  ]
}
*/
```

## 🆚 Comparison

| Feature | LEAN | JSON | YAML | CSV |
|---------|------|------|------|-----|
| **Human Readable** | ✅ | ⚠️ | ✅ | ⚠️ |
| **Compact Rows** | ✅ | ❌ | ❌ | ✅ |
| **Nested Objects** | ✅ | ✅ | ✅ | ❌ |
| **Comments** | ✅ | ❌ | ✅ | ❌ |

## 🔗 Ecosystem

- **[Core Library](./lean-format-npm)**: The reference JavaScript implementation.
- **[CLI Tool](./packages/cli)**: Command-line interface for converting and validating LEAN files.
- **[VS Code Extension](./packages/vscode)**: Syntax highlighting and snippets for Visual Studio Code.

### CLI with Piping

```bash
# Parse from stdin
cat data.lean | lean parse | jq .name

# Format from stdin
echo '{"name":"Alice","age":30}' | lean format

# Chain with other tools
curl api.example.com/data.json | lean format | tee output.lean
```

### TypeScript Support

```typescript
import { parse, format, validate } from '@lean-format/core';

const leanText = 'name: Alice\nage: 30';
const data = parse(leanText); // Full type inference
const formatted = format(data); // Type-safe
```

## 📚 Documentation

- **[Full Specification](./SPECIFICATION.md)**: The complete technical specification of the LEAN format.
- **[Contributing](./CONTRIBUTING.md)**: Guide for contributors.

## 📄 License

MIT © [LEAN Format Team](./LICENSE)
