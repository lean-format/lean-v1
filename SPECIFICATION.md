# lean-js
# LEAN Format Specification v1.0

**LEAN** — Lightweight Efficient Adaptive Notation

A minimal, human-readable data interchange format that combines the flexibility of JSON with the compactness of tabular data.

---

## 1. Introduction

### 1.1 Design Philosophy

LEAN is designed to be:
- **Compact** — eliminates repetition in list structures
- **Readable** — uses natural indentation and minimal syntax
- **Flexible** — adapts between object and row representations
- **Simple** — easy to write and parse

### 1.2 File Extension

LEAN files use the `.lean` extension.

### 1.3 MIME Type

`application/lean` or `text/lean`

---

## 2. Core Syntax

### 2.1 Indentation

LEAN uses **indentation** to denote structure. Each level of nesting adds one level of indentation.

**Valid indentation:**
- 2 spaces (recommended)
- 4 spaces
- 1 tab

**Mixed indentation within a file is not allowed.**

```lean
parent:
    child:
        grandchild: value
```

### 2.2 Key-Value Pairs

```lean
key: value
```

**Rules:**
- Keys are unquoted identifiers
- Keys must start with a letter, underscore, or dollar sign
- Keys may contain letters, numbers, underscores, hyphens, and dollar signs
- Colon (`:`) separates key from value
- Whitespace after colon is optional but recommended

**Examples:**
```lean
name: Alice
age: 30
is_active: true
user-id: 42
$special: value
```

### 2.3 Objects

Objects are represented by nested key-value pairs:

```lean
user:
    name: Alice
    age: 30
    active: true
```

**Equivalent JSON:**
```json
{
  "user": {
    "name": "Alice",
    "age": 30,
    "active": true
  }
}
```

### 2.4 Simple Lists

Lists of primitive values use hyphen (`-`) prefix:

```lean
tags:
    - news
    - tech
    - science
```

**Equivalent JSON:**
```json
{
  "tags": ["news", "tech", "science"]
}
```

### 2.5 Lists of Objects (Standard)

Lists of objects without headers:

```lean
users:
    - name: Alice
      age: 30
    - name: Bob
      age: 25
```

**Equivalent JSON:**
```json
{
  "users": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 }
  ]
}
```

---

## 3. Row Syntax (The LEAN Innovation)

### 3.1 Header Tuples

For lists of objects with repeated structure, LEAN supports **header tuples** for compact representation:

```lean
listName(key1, key2, key3):
    - value1, value2, value3
    - value1, value2, value3
```

**Example:**
```lean
reviews(id, customer, rating):
    - 101, Alice, 5
    - 102, Bob, 4
    - 103, Casey, 5
```

**Equivalent JSON:**
```json
{
  "reviews": [
    { "id": 101, "customer": "Alice", "rating": 5 },
    { "id": 102, "customer": "Bob", "rating": 4 },
    { "id": 103, "customer": "Casey", "rating": 5 }
  ]
}
```

### 3.2 Header Tuple Syntax

**Format:**
```
identifier(column1, column2, ...):
```

**Rules:**
- Parentheses contain comma-separated column labels
- Column labels follow identifier naming rules
- Whitespace around commas is optional
- Colon (`:`) terminates the header
- Each row maps positionally to the header columns

### 3.3 Row Values

Each row is a tuple of values separated by commas:

```lean
users(id, name, active):
    - 1, Alice, true
    - 2, Bob, false
```

**Rules:**
- Rows begin with hyphen (`-`) and space
- Values are comma-separated
- Values map positionally to header columns
- Trailing commas are not allowed

### 3.4 Missing Values

If a row has fewer values than columns, missing values become `null`:

```lean
reviews(id, customer, rating):
    - 101, Alice, 5
    - 102, Bob
    - 103, Casey, 4
```

**Equivalent JSON:**
```json
{
  "reviews": [
    { "id": 101, "customer": "Alice", "rating": 5 },
    { "id": 102, "customer": "Bob", "rating": null },
    { "id": 103, "customer": "Casey", "rating": 4 }
  ]
}
```

### 3.5 Extra Values (Strict Mode)

**Loose mode (default):**
Extra values beyond the header columns are **ignored** with a parser warning.

```lean
users(id, name):
    - 1, Alice, extraValue
```
→ `extraValue` is ignored

**Strict mode:**
Extra values cause a **parse error**.

Parsers should provide a flag to enable strict mode.

---

## 4. Value Types

LEAN supports six value types, following JSON-lite semantics.

### 4.1 Strings

**Unquoted strings:**
- Valid for single words without special characters
- Must not contain: `,` `:` `#` `[` `]` `{` `}` or whitespace
- Examples: `Alice`, `hello`, `user_name`, `test-123`

**Quoted strings:**
- Required for strings with spaces or special characters
- Use double quotes (`"`)
- Escape sequences: `\"`, `\\`, `\n`, `\r`, `\t`

```lean
name: Alice
title: "Senior Engineer"
message: "Hello, world!"
path: "C:\\Users\\Alice"
```

### 4.2 Numbers

**Integers:**
```lean
age: 30
count: -42
large: 1000000
```

**Floats:**
```lean
price: 19.99
ratio: -0.5
scientific: 1.5e10
```

### 4.3 Booleans

```lean
active: true
deleted: false
```

**Case-sensitive:** Must be lowercase `true` or `false`.

### 4.4 Null

```lean
middleName: null
```

**Case-sensitive:** Must be lowercase `null`.

### 4.5 Lists

Lists are collections of values:

```lean
numbers:
    - 1
    - 2
    - 3

mixed:
    - Alice
    - 42
    - true
    - null
```

### 4.6 Objects

Objects are nested key-value structures:

```lean
address:
    street: "123 Main St"
    city: Boston
    zip: 02101
```

---

## 5. Nested Structures

### 5.1 Objects Within Objects

```lean
user:
    name: Alice
    contact:
        email: alice@example.com
        phone: "555-1234"
```

### 5.2 Lists Within Objects

```lean
user:
    name: Alice
    tags:
        - admin
        - verified
```

### 5.3 Objects Within Lists

```lean
users:
    - name: Alice
      age: 30
    - name: Bob
      age: 25
```

### 5.4 Row Syntax Within Objects

```lean
store:
    name: CoffeeShop
    reviews(id, customer, rating):
        - 1, Alice, 5
        - 2, Bob, 4
```

### 5.5 Nested Rows

Row syntax can be used at any level:

```lean
departments(id, name):
    - 1, Engineering
    - 2, Marketing

employees(id, name, dept):
    - 101, Alice, 1
    - 102, Bob, 2
```

---

## 6. Comments

LEAN supports single-line comments using `#`:

```lean
# This is a comment
name: Alice  # inline comment
age: 30
```

**Rules:**
- Comments begin with `#` and continue to end of line
- Comments can appear on their own line or inline
- Comments are ignored by parsers

---

## 7. Whitespace Rules

### 7.1 Significant Whitespace

- **Indentation** — determines nesting level
- **Space after colon** — separates key from value (recommended, not required)
- **Space after hyphen** — separates list marker from value (required)
- **Space after comma** — separates row values (recommended, not required)

### 7.2 Insignificant Whitespace

- Blank lines (ignored)
- Trailing whitespace (ignored)
- Multiple spaces between tokens (collapsed to single space)

### 7.3 Line Breaks

- UNIX (`\n`), Windows (`\r\n`), and legacy Mac (`\r`) line endings are all supported
- Parsers should normalize line endings

---

## 8. Complete Examples

### 8.1 Simple Object

**LEAN:**
```lean
user:
    id: 42
    name: Alice
    email: alice@example.com
    active: true
```

**JSON:**
```json
{
  "user": {
    "id": 42,
    "name": "Alice",
    "email": "alice@example.com",
    "active": true
  }
}
```

### 8.2 List with Row Syntax

**LEAN:**
```lean
products(id, name, price, inStock):
    - 1, "Widget", 19.99, true
    - 2, "Gadget", 29.99, false
    - 3, "Doohickey", 9.99, true
```

**JSON:**
```json
{
  "products": [
    { "id": 1, "name": "Widget", "price": 19.99, "inStock": true },
    { "id": 2, "name": "Gadget", "price": 29.99, "inStock": false },
    { "id": 3, "name": "Doohickey", "price": 9.99, "inStock": true }
  ]
}
```

### 8.3 Complex Nested Structure

**LEAN:**
```lean
blog:
    title: "My Tech Blog"
    author: Alice
    tags:
        - tech
        - programming
        - ai
    posts(id, title, date):
        - 1, "Getting Started with LEAN", "2025-01-15"
        - 2, "Why Compact Formats Matter", "2025-02-01"
    comments(postId, user, text):
        - 1, Bob, "Great article!"
        - 1, Casey, "Very helpful"
        - 2, Dave, "Interesting perspective"
```

**JSON:**
```json
{
  "blog": {
    "title": "My Tech Blog",
    "author": "Alice",
    "tags": ["tech", "programming", "ai"],
    "posts": [
      { "id": 1, "title": "Getting Started with LEAN", "date": "2025-01-15" },
      { "id": 2, "title": "Why Compact Formats Matter", "date": "2025-02-01" }
    ],
    "comments": [
      { "postId": 1, "user": "Bob", "text": "Great article!" },
      { "postId": 1, "user": "Casey", "text": "Very helpful" },
      { "postId": 2, "user": "Dave", "text": "Interesting perspective" }
    ]
  }
}
```

---

## 9. Conversion Rules

### 9.1 LEAN to JSON

1. Parse indentation into nested structure
2. Convert key-value pairs to JSON objects
3. Convert lists to JSON arrays
4. For row syntax:
   - Parse header tuple into column names
   - Map each row to object using positional mapping
   - Missing values become `null`
5. Preserve value types (string, number, boolean, null)

### 9.2 JSON to LEAN

**Decision tree for lists of objects:**

```
Is the list of objects uniform (same keys, same order)?
├─ YES, and > 3 items → Use row syntax
├─ YES, but ≤ 3 items → Use standard object list syntax
└─ NO → Use standard object list syntax
```

**Example:**
```json
{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}
```

**Standard syntax (short list):**
```lean
users:
    - id: 1
      name: Alice
    - id: 2
      name: Bob
```

**Row syntax (longer list):**
```lean
users(id, name):
    - 1, Alice
    - 2, Bob
```

---

## 10. Parser Requirements

### 10.1 Mandatory Features

A conforming LEAN parser MUST:
- Support all value types (string, number, boolean, null, list, object)
- Support both standard list and row syntax
- Handle missing values in row syntax (map to `null`)
- Support comments (`#`)
- Support all indentation styles (2-space, 4-space, tab)
- Reject mixed indentation
- Normalize line endings
- Provide clear error messages with line numbers

### 10.2 Optional Features

A conforming LEAN parser MAY:
- Provide strict mode (reject extra row values)
- Provide schema validation
- Support custom value parsers (dates, URLs, etc.)
- Preserve comments in AST
- Support streaming parsing

### 10.3 Error Handling

Parsers should report errors with:
- Line number
- Column number (if available)
- Clear description of the error
- Suggestion for fixing (if applicable)

**Example error:**
```
Error at line 5, column 8:
  Expected value after colon, found newline
  
  4 | user:
  5 |     name:
             ^
  6 |     age: 30
  
  Suggestion: Add a value after 'name:'
```

---

## 11. Strict Mode

### 11.1 Strict Mode Behavior

When strict mode is enabled:

1. **Extra row values** → parse error
2. **Duplicate keys** → parse error
3. **Invalid indentation** → parse error (always enforced)
4. **Type consistency** (optional) → warn if row column types vary

### 11.2 Enabling Strict Mode

Parser-dependent. Recommended approaches:
- CLI flag: `--strict`
- API option: `parse(input, { strict: true })`
- File pragma: `# lean:strict`

---

## 12. Edge Cases

### 12.1 Empty Lists

```lean
tags:
```

**Result:** `{ "tags": [] }`

### 12.2 Empty Objects

```lean
user:
```

**Result:** `{ "user": {} }`

### 12.3 Empty Row List

```lean
users(id, name):
```

**Result:** `{ "users": [] }`

### 12.4 Single-Column Rows

```lean
ids(value):
    - 1
    - 2
    - 3
```

**Result:**
```json
{
  "ids": [
    { "value": 1 },
    { "value": 2 },
    { "value": 3 }
  ]
}
```

### 12.5 All Missing Values

```lean
records(a, b, c):
    - 
    - 1
```

**Result:**
```json
{
  "records": [
    { "a": null, "b": null, "c": null },
    { "a": 1, "b": null, "c": null }
  ]
}
```

---

## 13. Comparison with Other Formats

| Feature | JSON | YAML | CSV | LEAN |
|---------|------|------|-----|------|
| Human-readable | ⚠️ Verbose | ✅ Yes | ⚠️ Limited | ✅ Yes |
| Compact rows | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Nested objects | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Schema-optional | ✅ Yes | ✅ Yes | ⚠️ Implicit | ✅ Yes |
| No key repetition | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Mixed structures | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Comments | ❌ No | ✅ Yes | ❌ No | ✅ Yes |

---

## 14. Future Considerations

### 14.1 Potential Extensions

- **Multi-line strings** — heredoc syntax
- **Inline lists** — `tags: [a, b, c]`
- **Type hints** — `age:int: 30`
- **Anchors/references** — YAML-style `&` and `*`
- **Binary data** — Base64 with type hint

### 14.2 Versioning

This specification is version **1.0**.

Future versions will maintain backward compatibility with 1.0 or clearly document breaking changes.

---

## 15. Reference Implementation

A reference JavaScript parser is available at:
https://github.com/lean-format/lean-js

---

## Appendix A: Grammar (EBNF-style)

```
document     = item*
item         = comment | keyValue | list | rowList
comment      = "#" [^\n]* "\n"
keyValue     = key ":" value
key          = identifier
value        = string | number | boolean | null | object | list
object       = "\n" INDENT (item)* DEDENT
list         = "\n" INDENT ("-" value "\n")* DEDENT
rowList      = key "(" columnList ")" ":" "\n" INDENT ("-" rowValues "\n")* DEDENT
columnList   = identifier ("," identifier)*
rowValues    = value ("," value)*
identifier   = [a-zA-Z_$][a-zA-Z0-9_$-]*
string       = unquotedString | quotedString
unquotedString = [^ ,:\#\[\]\{\}\n\r\t]+
quotedString = "\"" (character | escape)* "\""
number       = integer | float
boolean      = "true" | "false"
null         = "null"
```

---

## Appendix B: Credits

**LEAN Format Specification v1.0**

Created: 2025
License: MIT

Designed to be a modern, human-friendly alternative to JSON, YAML, and CSV for data interchange.

---

**END OF SPECIFICATION**
