# LEAN Format

[![npm version](https://badge.fury.io/js/lean-format.svg)](https://www.npmjs.com/package/lean-format)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/lean-format/lean-js/workflows/Tests/badge.svg)](https://github.com/lean-format/lean-js/actions)

**LEAN** (Lightweight Efficient Adaptive Notation) is a minimal, human-readable data interchange format that combines the flexibility of JSON with the compactness of tabular data.

## 🌟 Why LEAN?

- **Compact** - Row syntax eliminates key repetition in lists
- **Readable** - Natural indentation and minimal syntax
- **Flexible** - Adapts between object and row representations
- **Simple** - Easy to write and parse

## 📦 Installation

```bash
npm install lean-format
```

## 🚀 Quick Start

### Node.js

```javascript
const { parse, format } = require('lean-format');

// Parse LEAN to JavaScript
const data = parse(`
users(id, name, age):
    - 1, Alice, 30
    - 2, Bob, 25
`);

console.log(data);
// {
//   users: [
//     { id: 1, name: 'Alice', age: 30 },
//     { id: 2, name: 'Bob', age: 25 }
//   ]
// }

// Format JavaScript as LEAN
const lean = format(data);
console.log(lean);
```

### Browser (ES Module)

```html
<script type="module">
import { parse, format } from 'https://unpkg.com/lean-format/dist/index.esm.js';

const data = parse('key: value');
console.log(data);
</script>
```

### Browser (UMD)

```html
<script src="https://unpkg.com/lean-format"></script>
<script>
  const { parse, format } = LEAN;
  const data = parse('key: value');
</script>
```

## 📖 API Reference

### `parse(input, options)`

Parse LEAN format text into JavaScript object.

**Parameters:**
- `input` (string) - LEAN format text
- `options` (object) - Optional configuration
  - `strict` (boolean) - Enable strict mode (default: false)

**Returns:** Parsed JavaScript object

**Example:**
```javascript
const data = parse(`
users(id, name):
    - 1, Alice
    - 2, Bob
`, { strict: true });
```

### `format(obj, options)`

Convert JavaScript object to LEAN format.

**Parameters:**
- `obj` (object) - JavaScript object to serialize
- `options` (object) - Optional configuration
  - `indent` (string) - Indentation string (default: '  ')
  - `useRowSyntax` (boolean) - Enable row syntax (default: true)
  - `rowThreshold` (number) - Min items for row syntax (default: 3)

**Returns:** LEAN format string

**Example:**
```javascript
const lean = format({ users: [...] }, {
  indent: '    ',
  useRowSyntax: true,
  rowThreshold: 5
});
```

### `validate(input, options)`

Validate LEAN format text.

**Parameters:**
- `input` (string) - LEAN format text
- `options` (object) - Optional configuration
  - `strict` (boolean) - Enable strict mode

**Returns:** `{ valid: boolean, errors: Array }`

**Example:**
```javascript
const result = validate(leanText);
if (!result.valid) {
  result.errors.forEach(err => {
    console.error(`Line ${err.line}: ${err.message}`);
  });
}
```

## 🎯 LEAN Format Examples

### Row Syntax (Compact Tables)

```lean
products(id, name, price, stock):
    - 1, "Wireless Mouse", 29.99, 45
    - 2, "Keyboard", 89.99, 23
    - 3, "USB Hub", 49.99, 67
```

### Nested Objects

```lean
company:
    name: "Acme Corp"
    founded: 2020
    address:
        street: "123 Main St"
        city: Boston
        zip: 02101
```

### Lists

```lean
tags:
    - technology
    - programming
    - data

users:
    - name: Alice
      age: 30
    - name: Bob
      age: 25
```

### Mixed Structures

```lean
blog:
    title: "Tech Blog"
    tags:
        - tech
        - code
    posts(id, title, date):
        - 1, "First Post", "2025-01-15"
        - 2, "Second Post", "2025-02-01"
    config:
        theme: dark
        comments: true
```

## 🖥️ Command Line Interface

The package includes a CLI tool:

```bash
# Parse LEAN to JSON
lean parse data.lean

# Format JSON as LEAN
lean format data.json

# Convert between formats
lean convert input.lean output.json

# Validate LEAN syntax
lean validate data.lean --strict

# Watch and auto-convert
lean watch data.lean

# Create sample file
lean init mydata
```

Run `lean help` for full CLI documentation.

## ⚙️ TypeScript Support

```typescript
import { parse, format, validate } from 'lean-format';

interface User {
  id: number;
  name: string;
  age: number;
}

const data = parse<{ users: User[] }>(`
users(id, name, age):
    - 1, Alice, 30
    - 2, Bob, 25
`);
```

## 🧪 Testing

```bash
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## 📊 Format Comparison

| Feature | JSON | YAML | CSV | LEAN |
|---------|------|------|-----|------|
| Human-readable | ⚠️ | ✅ | ⚠️ | ✅ |
| Compact rows | ❌ | ❌ | ✅ | ✅ |
| Nested objects | ✅ | ✅ | ❌ | ✅ |
| No key repetition | ❌ | ❌ | ✅ | ✅ |
| Comments | ❌ | ✅ | ❌ | ✅ |

## 🛠️ Advanced Usage

### Custom Indentation

```javascript
const lean = format(data, { indent: '\t' }); // Tabs
const lean = format(data, { indent: '    ' }); // 4 spaces
```

### Disable Row Syntax

```javascript
const lean = format(data, { useRowSyntax: false });
```

### Strict Validation

```javascript
const data = parse(input, { strict: true });
// Throws error on:
// - Extra row values
// - Duplicate keys
// - Mixed indentation
```

## 🔗 Ecosystem

- **CLI Tool** - Command-line converter (included)
- **VS Code Extension** - Syntax highlighting
- **Online Playground** - Interactive converter
- **Python Parser** - Coming soon
- **Go Parser** - Coming soon

## 📚 Resources

- [Full Specification](https://leanformat.org/spec)
- [Online Playground](https://leanformat.org/playground)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=lean-format.lean-format)
- [GitHub Repository](https://github.com/lean-format/lean-js)

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Inspired by JSON, YAML, CSV, and the need for a format that combines their best features.

---

Made with ❤️ by the LEAN Format Team
