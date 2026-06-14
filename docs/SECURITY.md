# Security Guide

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x.x   | ✅ Active development |
| 1.x.x   | ❌ No longer supported |

## DoS Protection

The LEAN parser includes configurable limits to prevent denial-of-service attacks:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDepth` | number | 100 | Maximum nesting depth. Exceeding this throws a parse error. |
| `maxInputSize` | number | 0 (unlimited) | Maximum input size in bytes. Set to a positive number to reject oversized inputs before parsing. |

### Usage

```typescript
import { parse } from '@lean-format/core';

// Limit nesting to 50 levels
const data = parse(input, { maxDepth: 50 });

// Reject inputs larger than 1MB
const data = parse(input, { maxDepth: 100, maxInputSize: 1_000_000 });
```

### Why These Limits Matter

- **Nested depth**: Unchecked recursion in deeply nested inputs can cause stack overflow in the parser
- **Input size**: Large inputs consume memory proportional to input size; limiting prevents OOM attacks

## WASM Parser Safety

The Rust/WASM parser runs in a sandboxed WebAssembly environment. It:

- Has no access to the file system, network, or system APIs
- Operates solely on the input string provided to `parse()`
- Falls back to the TypeScript parser automatically if WASM fails to load

## Schema Validation

When using `validateSchema()`, ensure schemas come from trusted sources. Malicious schemas with excessive nesting or circular references could cause validation to consume excessive resources.

## npm Provenance

Published npm packages include [provenance statements](https://docs.npmjs.com/generating-provenance-statements) when published via GitHub Actions, linking each package to the exact commit and workflow run that produced it.

## Security Audit

The CI pipeline runs both `npm audit` and `cargo audit` on every build to detect known vulnerabilities in dependencies.
