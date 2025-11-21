# @lean-format

Meta package for LEAN Format - A minimal, human-readable data interchange format.

## Quick Install

```bash
npm install @lean-format
```

This package is a convenience wrapper that installs `@lean-format/core`. Both packages provide the same functionality.

## What is LEAN?

LEAN (Lightweight Efficient Adaptive Notation) is a data format that's:
- **40% more compact** than JSON for tabular data
- **Human-readable** with natural syntax
- **Flexible** with support for row syntax, comments, and dot notation

## Usage

```javascript
import { parse, format } from '@lean-format';

// Parse LEAN to JavaScript
const data = parse(`
users(id, name, email):
  - 1, Alice, alice@example.com
  - 2, Bob, bob@example.com
`);

// Format JavaScript as LEAN
const lean = format(data);
console.log(lean);
```

## Packages

This is a meta package that includes:
- **[@lean-format/core](https://www.npmjs.com/package/@lean-format/core)** - Core parser and serializer

You can also install packages individually:
```bash
npm install @lean-format/core  # Core library
npm install -g @lean-format/cli  # Command-line tool
```

## Features

- ✅ **Row Syntax** - Compact tabular data representation
- ✅ **Comments** - Line and inline comments supported
- ✅ **Dot Notation** - Simplified nested object syntax
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Schema Validation** - JSON Schema-like validation
- ✅ **94% Test Coverage** - Production-ready

## Learn More

- [Documentation](https://lean-format.github.io/lean-v1/)
- [Specification](https://github.com/lean-format/lean-v1/blob/restruct/SPECIFICATION.md)
- [API Reference](https://github.com/lean-format/lean-v1/blob/restruct/docs/API_INTEGRATION.md)
- [GitHub Repository](https://github.com/lean-format/lean-v1)

## License

MIT © LEAN Format Team
