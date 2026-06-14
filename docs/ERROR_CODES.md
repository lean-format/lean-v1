# Error Codes Reference

All parse errors in the LEAN reference implementation include a structured `code` field for programmatic handling.

## ErrorCode Enum

| Code | Value | Description |
|------|-------|-------------|
| `UNEXPECTED_TOKEN` | `"UNEXPECTED_TOKEN"` | Token encountered where it doesn't belong |
| `INVALID_INDENT` | `"INVALID_INDENT"` | Indentation doesn't match expected level |
| `UNEXPECTED_INDENT` | `"UNEXPECTED_INDENT"` | Indentation increase without child content |
| `UNEXPECTED_DEDENT` | `"UNEXPECTED_DEDENT"` | Dedent to a non-existent parent level |
| `EXPECTED_KEY` | `"EXPECTED_KEY"` | Expected a key name at current position |
| `EXPECTED_VALUE` | `"EXPECTED_VALUE"` | Expected a value after colon or operator |
| `EXPECTED_COLON` | `"EXPECTED_COLON"` | Expected colon after key name |
| `EXPECTED_IDENTIFIER` | `"EXPECTED_IDENTIFIER"` | Expected identifier for key or column name |
| `EXPECTED_STRING` | `"EXPECTED_STRING"` | Expected a quoted string value |
| `EXPECTED_NUMBER` | `"EXPECTED_NUMBER"` | Expected a numeric value |
| `EXPECTED_BOOLEAN` | `"EXPECTED_BOOLEAN"` | Expected `true` or `false` |
| `EXPECTED_NULL` | `"EXPECTED_NULL"` | Expected `null` value |
| `EXPECTED_COMMA` | `"EXPECTED_COMMA"` | Expected comma separator |
| `EXPECTED_PAREN` | `"EXPECTED_PAREN"` | Expected opening/closing parenthesis for row header |
| `DUPLICATE_KEY` | `"DUPLICATE_KEY"` | Duplicate key found in strict mode |
| `EXTRA_VALUE` | `"EXTRA_VALUE"` | Extra values in row beyond header columns |

## Error Object Structure

```typescript
interface LeanParseError {
  code: ErrorCodeType;     // Machine-readable error code
  message: string;         // Human-readable description
  line: number;            // 1-indexed line number
  column?: number;         // 1-indexed column number
  snippet?: string;        // Code snippet showing error location
  suggestion?: string;     // Fix suggestion (if applicable)
}
```

## Usage

```typescript
import { parse, ErrorCode } from '@lean-format/core';

try {
  const data = parse(input);
} catch (error) {
  switch (error.code) {
    case ErrorCode.UNEXPECTED_TOKEN:
      // Handle syntax error
      break;
    case ErrorCode.DUPLICATE_KEY:
      // Handle duplicate key (strict mode only)
      break;
    case ErrorCode.EXTRA_VALUE:
      // Handle extra row values (strict mode only)
      break;
  }
}
```

## Import

```typescript
import { ErrorCode, ErrorCodeType } from '@lean-format/core';
```

`ErrorCode` is a const enum with string values. `ErrorCodeType` is the union type of all error code strings.
