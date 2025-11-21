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
npm install @lean/core express
```

### Basic Server
```javascript
import express from 'express';
import { parse, format } from '@lean/core';

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
import { parse, format, validateSchema } from '@lean/core';

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

## Python/Flask Integration

### Using subprocess (CLI)
```python
from flask import Flask, request, Response
import subprocess
import json

app = Flask(__name__)

def lean_to_dict(lean_text):
    """Convert LEAN text to Python dict using CLI"""
    result = subprocess.run(
        ['lean', 'parse'],
        input=lean_text,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise ValueError(f"LEAN parse error: {result.stderr}")
    return json.loads(result.stdout)

def dict_to_lean(data):
    """Convert Python dict to LEAN text using CLI"""
    result = subprocess.run(
        ['lean', 'format'],
        input=json.dumps(data),
        capture_output=True,
        text=True
    )
    return result.stdout

@app.route('/api/users', methods=['POST'])
def create_user():
    # Parse LEAN request
    lean_data = request.get_data(as_text=True)
    try:
        user_data = lean_to_dict(lean_data)
    except ValueError as e:
        return {'error': str(e)}, 400
    
    # Process user...
    result = {'id': 1, **user_data}
    
    # Return LEAN response
    return Response(
        dict_to_lean(result),
        mimetype='application/lean'
    )
```

### Using Python Package (Future)
```python
# Coming soon: pip install lean-format
from lean_format import parse, format

@app.route('/api/users', methods=['POST'])
def create_user():
    user_data = parse(request.get_data(as_text=True))
    result = process_user(user_data)
    return Response(format(result), mimetype='application/lean')
```

---

## FastAPI Integration

```python
from fastapi import FastAPI, Request, Response
import subprocess
import json

app = FastAPI()

async def parse_lean(request: Request) -> dict:
    body = await request.body()
    result = subprocess.run(
        ['lean', 'parse'],
        input=body.decode(),
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

@app.post("/api/users")
async def create_user(request: Request):
    if request.headers.get('content-type') == 'application/lean':
        user_data = await parse_lean(request)
    else:
        user_data = await request.json()
    
    # Process...
    return Response(
        content=dict_to_lean(user_data),
        media_type="application/lean"
    )
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

## Performance Considerations

### Caching Parsed Results
```javascript
const cache = new Map();

function parseCached(leanText) {
  const hash = crypto.createHash('md5').update(leanText).digest('hex');
  if (cache.has(hash)) {
    return cache.get(hash);
  }
  const parsed = parse(leanText);
  cache.set(hash, parsed);
  return parsed;
}
```

### Streaming Large Payloads
```javascript
import { Readable } from 'stream';

app.post('/api/bulk', (req, res) => {
  const stream = Readable.from(req.body.split('\n\n'));
  
  stream.on('data', (chunk) => {
    const data = parse(chunk.toString());
    processBulkItem(data);
  });
});
```

---

## See Also

- [Postman Collection](../examples/postman_collection.json)
- [LEAN Specification](../SPECIFICATION.md)
- [npm Package (@lean/core)](https://npmjs.com/package/@lean/core)
