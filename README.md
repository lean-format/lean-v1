# LEAN Format

[![npm version](https://badge.fury.io/js/@lean-format%2fcore.svg)](https://www.npmjs.com/package/@lean-format/core)
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
npm install @lean-format/core
```

### CLI Tool

```bash
npm install -g @lean-format/cli
```

### Usage

```javascript
import { parse, format } from '@lean-format/core';

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

- **[Core Library](https://www.npmjs.com/package/@lean-format/core)**: The reference JavaScript implementation.
- **[CLI Tool](./packages/cli)**: Command-line interface for converting and validating LEAN files.
- **[VS Code Extension](./packages/vscode)**: Syntax highlighting and snippets for Visual Studio Code.

## Performance

LEAN's TypeScript parser delivers **~59 MB/s throughput** — competitive with native `JSON.parse` and **3–10× faster** than popular JS YAML/TOML parsers.

| Size | JS (median) | WASM | Ratio |
|------|:-:|:-:|:-:|
| 10KB | 0.09 ms | 0.22 ms | 0.41x |
| 100KB | 0.88 ms | 2.04 ms | 0.43x |
| 1MB | 15.83 ms | 19.90 ms | 0.80x |
| 5MB | 88.03 ms | 95.39 ms | 0.92x |
| 10MB | 169.08 ms | 190.31 ms | 0.89x |

- **Warm parse (5KB):** ~46 µs — 21,544 parses/sec
- **Throughput:** 59 MB/s (10MB in 169 ms)
- JS beats WASM at every tested size with no crossover
- Measured via median of 10K–20 iterations per size with 100-iteration JIT warm-up

## Advanced Usage

```typescript
import { parse, format } from '@lean-format/core';
import { ParseCache, cachedParse } from '@lean-format/core';
import { IncrementalParser } from '@lean-format/core';
import { analyze, formatWarnings } from '@lean-format/core';

// Cached parsing (LRU cache with content-hash keys)
const result = await cachedParse(input, { strict: true });

// Incremental parsing — re-parses only changed blocks
const parser = new IncrementalParser();
let doc = parser.parse(text);
doc = parser.parse(editedText); // only modified blocks re-parsed

// Semantic analysis — type consistency, trailing commas, mixed indent
const analysis = analyze(text, parsed);
console.log(formatWarnings(analysis));
```

### CLI with Piping

```bash
# Parse from stdin
cat data.lean | lean parse | jq .name

# Format from stdin
echo '{"name":"Alice","age":30}' | lean format

# Chain with other tools
curl api.example.com/data.json | lean format | tee output.lean

# Validate with strict mode
  lean validate data.lean --strict        # Validate with strict mode

# Compile to multiple formats
  lean compile config.lean                # Output JSON/YAML/TOML/.env
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
