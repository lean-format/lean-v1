# API Integration Guide

## Using LEAN Format in Your APIs

LEAN Format is perfect for API payloads and responses. It's more readable than JSON, easier to write by hand, and supports comments for documentation.

---

## Content-Type Header

Use the custom MIME type for LEAN:
```
Content-Type: application/lean
Accept: application/lean
```

---

## Node.js/Express Integration

### Install
```bash
npm install @lean-format/core express
```

### Basic Server
```javascript
import express from 'express';
import { parse, format } from '@lean-format/core';

const app = express();

// Middleware to parse LEAN bodies
app.use(express.text({ type: 'application/lean' }));

// Middleware to parse LEAN automatically
app.use((req, res, next) => {
  if (req.is('application/lean') && req.body) {
    try {
      req.leanData = parse(req.body);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid LEAN format' });
    }
  }
  next();
});

// Helper to send LEAN responses
res.lean = function(data) {
  this.type('application/lean');
  this.send(format(data));
};

// Use in routes
app.post('/api/users', (req, res) => {
  const userData = req.leanData;
  
  // Process user data...
  const newUser = {
    id: 123,
    ...userData,
    created_at: new Date().toISOString()
  };
  
  // Respond with LEAN
  res.lean(newUser);
});

app.listen(3000);
```

### Advanced Example with Validation
```javascript
import { parse, format, validateSchema } from '@lean-format/core';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', pattern: '^.+@.+\\..+$' },
    age: { type: 'number', minimum: 0, maximum: 150 }
  },
  required: ['name', 'email']
};

app.post('/api/users', (req, res) => {
  const userData = req.leanData;
  
  // Validate against schema
  const validation = validateSchema(userData, userSchema);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }
  
  // Process valid data...
  res.lean({ success: true, user: userData });
});
```

---

## Python Integration

> **Note:** A native Python implementation exists at `src/lean/` in the [oneroute](https://github.com/anomalyco/oneroute) repo. It supports all core LEAN features plus inline objects/arrays, dot-notation expansion, WebSocket codec, and HTTP response helpers. All examples below use the native library — no `subprocess` needed.

### Python/Flask

```python
from flask import Flask, request, Response
from src.lean import parse, format

app = Flask(__name__)

@app.route('/api/users', methods=['POST'])
def create_user():
    user_data = parse(request.get_data(as_text=True))
    result = {'id': 1, **user_data}
    return Response(format(result), mimetype='application/lean')
```

### Python/FastAPI (with ?format=lean support)

```python
from fastapi import FastAPI, Request, Response
from src.lean import parse, format, LeanableResponse

app = FastAPI()

@app.get("/api/items")
async def get_items(format: str = "json"):
    data = {"items": [{"id": 1, "name": "Alice"}]}
    if format == "lean":
        return Response(content=format(data), media_type="text/x-lean")
    return data
```

---

## Go Integration

```go
package main

import (
    "encoding/json"
    "net/http"
    "os/exec"
)

func parseLean(leanText string) (map[string]interface{}, error) {
    cmd := exec.Command("lean", "parse")
    cmd.Stdin = strings.NewReader(leanText)
    output, err := cmd.Output()
    if err != nil {
        return nil, err
    }
    
    var result map[string]interface{}
    json.Unmarshal(output, &result)
    return result, nil
}

func formatLean(data map[string]interface{}) (string, error) {
    jsonData, _ := json.Marshal(data)
    cmd := exec.Command("lean", "format")
    cmd.Stdin = bytes.NewReader(jsonData)
    output, err := cmd.Output()
    return string(output), err
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    body, _ := ioutil.ReadAll(r.Body)
    userData, err := parseLean(string(body))
    if err != nil {
        http.Error(w, "Invalid LEAN", http.StatusBadRequest)
        return
    }
    
    // Process userData...
    
    w.Header().Set("Content-Type", "application/lean")
    leanOutput, _ := formatLean(userData)
    w.Write([]byte(leanOutput))
}
```

---

## Real-World API Examples

### 1. REST API with LEAN
```
POST /api/v1/orders
Content-Type: application/lean

customer_id: 12345
items(sku, quantity, price):
  - WIDGET-001, 2, 29.99
  - GADGET-002, 1, 49.99
shipping:
  method: express
  address: "123 Main St, Springfield, 12345"
```

**Response:**
```
HTTP/1.1 201 Created
Content-Type: application/lean

order_id: 67890
status: confirmed
total: 109.97
estimated_delivery: 2024-11-25
items_count: 2
```

### 2. Configuration API
```
PUT /api/v1/config
Content-Type: application/lean

database:
  host: db.example.com
  port: 5432
  pool.max: 20
cache:
  enabled: true
  ttl: 3600
features:
  - authentication
  - rate-limiting
```

### 3. Webhook Payload
```
POST https://your-app.com/webhooks/payment
Content-Type: application/lean
X-Webhook-Signature: sha256=...

event: payment.succeeded
id: evt_12345
timestamp: 2024-11-21T18:00:00Z

data:
  payment_id: pay_67890
  amount: 99.99
  currency: USD
  customer.id: cus_12345
  customer.email: customer@example.com
```

---

## Testing with cURL

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/lean" \
  -d $'name: Alice\nemail: alice@example.com\nage: 30'

# Get user (request LEAN response)
curl http://localhost:3000/api/users/1 \
  -H "Accept: application/lean"

# Update config
curl -X PUT http://localhost:3000/api/config \
  -H "Content-Type: application/lean" \
  -d $'app.debug: false\napp.version: 2.0.0'
```

---

## Best Practices

### 1. Content Negotiation
Support both JSON and LEAN based on `Accept` header:

```javascript
app.get('/api/users/:id', (req, res) => {
  const user = getUser(req.params.id);
  
  if (req.accepts('application/lean')) {
    res.lean(user);
  } else {
    res.json(user);
  }
});
```

### 2. Error Handling
Return errors in the same format as requested:

```javascript
app.use((err, req, res, next) => {
  const error = {
    error: err.message,
    code: err.code || 500,
    timestamp: new Date().toISOString()
  };
  
  if (req.accepts('application/lean')) {
    res.status(error.code).lean(error);
  } else {
    res.status(error.code).json(error);
  }
});
```

### 3. Validation
Always validate input:

```javascript
const schema = {
  type: 'object',
  properties: { /* ... */ },
  required: ['name', 'email']
};

const validation = validateSchema(req.leanData, schema);
if (!validation.valid) {
  return res.status(400).lean({
    error: 'Validation failed',
    details: validation.errors
  });
}
```

### 4. Documentation
Use OpenAPI/Swagger with custom LEAN examples:

```yaml
paths:
  /api/users:
    post:
      requestBody:
        content:
          application/lean:
            example: |
              name: Alice
              email: alice@example.com
              age: 30
      responses:
        '201':
          content:
            application/lean:
              example: |
                id: 123
                name: Alice
                created_at: 2024-11-21T18:00:00Z
```

---

### Error Handling with Error Codes

```javascript
import { parse, ErrorCode } from '@lean-format/core';

try {
  const data = parse(input);
} catch (error) {
  if (error.code === ErrorCode.UNEXPECTED_TOKEN) {
    // Handle unexpected token specifically
    console.error(`Parse error at line ${error.line}: ${error.message}`);
  }
  // All errors include: code, message, line, column, snippet, suggestion
}
```

---

## Performance

The JS parser delivers **~59 MB/s** throughput at 10MB, with a **~46 µs** warm parse time for typical config files (5KB). See the [README](../README.md#performance) for the full benchmark table.

### Caching Parsed Results

Uses an LRU cache with content-hash keys and option-aware lookups:

```typescript
import { ParseCache, cachedParse } from '@lean-format/core';

// Global default cache (max 64 entries)
const result = await cachedParse(input, options);

// Or create your own with custom size
const cache = new ParseCache(128);
const result = await cachedParse(input, options, cache);

console.log(cache.stats()); // { hits, misses, evictions, size, maxSize }
```

### Incremental Parsing

Re-parses only changed top-level blocks when the document is edited — useful in editors or watch-mode tools:

```typescript
import { IncrementalParser } from '@lean-format/core';

const parser = new IncrementalParser();
let doc = parser.parse(initialText);  // full parse
doc = parser.parse(editedText);       // only changed blocks re-parsed
doc = parser.parse(identicalText);    // returns cached result instantly
parser.reset();                        // clear state
```

### Semantic Analysis

Post-parse analysis detects type inconsistencies, trailing commas, mixed indentation, and suspicious references:

```typescript
import { parse, analyze, formatWarnings } from '@lean-format/core';

const data = parse(text);
const analysis = analyze(text, data);

if (analysis.warnings.length > 0) {
  console.warn(formatWarnings(analysis));
  // e.g. "type-inconsistency[key.value]: has inconsistent types: string, number"
  //      "trailing-comma[line 3]: Trailing comma on line 3"
}
```

---

## See Also

- [Postman Collection](../examples/postman_collection.json)
- [LEAN Specification](../SPECIFICATION.md)
- [npm Package (@lean-format/core)](https://npmjs.com/package/@lean-format/core)
