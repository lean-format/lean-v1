<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LEAN Playground</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }

        h1 {
            font-size: 3em;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .panel-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            font-weight: 600;
            font-size: 1.1em;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .panel-content {
            padding: 20px;
            height: 500px;
            display: flex;
            flex-direction: column;
        }

        textarea {
            flex: 1;
            width: 100%;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            resize: none;
            outline: none;
            transition: border-color 0.3s;
        }

        textarea:focus {
            border-color: #667eea;
        }

        .controls {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        button:active {
            transform: translateY(0);
        }

        button.secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .options {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            color: #333;
            cursor: pointer;
        }

        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        select {
            padding: 8px 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 1em;
            cursor: pointer;
            outline: none;
            transition: border-color 0.3s;
        }

        select:focus {
            border-color: #667eea;
        }

        .error {
            background: #fee;
            border: 2px solid #fcc;
            color: #c00;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            white-space: pre-wrap;
        }

        .success {
            background: #efe;
            border: 2px solid #cfc;
            color: #060;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            text-align: center;
            font-weight: 600;
        }

        .examples {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            padding: 20px;
            margin-top: 20px;
        }

        .examples h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .example-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .example-btn {
            background: #f5f5f5;
            color: #333;
            border: 2px solid #e0e0e0;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.9em;
            cursor: pointer;
            transition: all 0.2s;
        }

        .example-btn:hover {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        .stats {
            display: flex;
            gap: 10px;
            font-size: 0.9em;
            color: white;
        }

        .stat {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 4px;
        }

        @media (max-width: 1024px) {
            .main-grid {
                grid-template-columns: 1fr;
            }

            h1 {
                font-size: 2em;
            }

            .options {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌟 LEAN Playground</h1>
            <p class="subtitle">Lightweight Efficient Adaptive Notation</p>
        </header>

        <div class="main-grid">
            <div class="panel">
                <div class="panel-header">
                    <span>LEAN Format</span>
                    <div class="stats">
                        <span class="stat" id="leanLines">0 lines</span>
                        <span class="stat" id="leanChars">0 chars</span>
                    </div>
                </div>
                <div class="panel-content">
                    <textarea id="leanInput" placeholder="Enter LEAN format here...
Example:
users(id, name, age):
    - 1, Alice, 30
    - 2, Bob, 25"></textarea>
                    <div id="leanError"></div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <span>JSON Output</span>
                    <div class="stats">
                        <span class="stat" id="jsonLines">0 lines</span>
                        <span class="stat" id="jsonChars">0 chars</span>
                    </div>
                </div>
                <div class="panel-content">
                    <textarea id="jsonOutput" placeholder="JSON will appear here..." readonly></textarea>
                    <div id="jsonError"></div>
                </div>
            </div>
        </div>

        <div class="controls">
            <button onclick="convertLeanToJson()">LEAN → JSON</button>
            <button onclick="convertJsonToLean()">JSON → LEAN</button>
            <button class="secondary" onclick="clearAll()">Clear All</button>
            
            <div class="options">
                <label>
                    <input type="checkbox" id="strictMode">
                    Strict Mode
                </label>
                <label>
                    <input type="checkbox" id="useRowSyntax" checked>
                    Use Row Syntax
                </label>
                <label>
                    Indent:
                    <select id="indentSize">
                        <option value="2" selected>2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="tab">Tab</option>
                    </select>
                </label>
            </div>
        </div>

        <div class="examples">
            <h3>📚 Example Datasets</h3>
            <div class="example-buttons">
                <button class="example-btn" onclick="loadExample('simple')">Simple Object</button>
                <button class="example-btn" onclick="loadExample('users')">User List</button>
                <button class="example-btn" onclick="loadExample('products')">Product Catalog</button>
                <button class="example-btn" onclick="loadExample('blog')">Blog Structure</button>
                <button class="example-btn" onclick="loadExample('complex')">Complex Nested</button>
                <button class="example-btn" onclick="loadExample('mixed')">Mixed Types</button>
            </div>
        </div>
    </div>

    <script>
        // Embed the LEAN parser
        class LeanParser {
            constructor(options = {}) {
                this.strict = options.strict || false;
                this.input = '';
                this.lines = [];
                this.currentLine = 0;
                this.indentSize = null;
                this.indentChar = null;
            }

            parse(input) {
                this.input = input;
                this.lines = this.normalizeLines(input);
                this.currentLine = 0;
                this.indentSize = null;
                this.indentChar = null;
                return this.parseDocument();
            }

            normalizeLines(input) {
                return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
                    .map((line, idx) => ({
                        text: line,
                        number: idx + 1,
                        indent: this.getIndent(line),
                        content: line.trim()
                    }));
            }

            getIndent(line) {
                const match = line.match(/^(\s*)/);
                if (!match) return 0;
                const whitespace = match[1];
                if (whitespace.length === 0) return 0;
                if (this.indentChar === null) {
                    this.indentChar = whitespace[0];
                    if (this.indentChar === ' ') {
                        const spaces = whitespace.length;
                        this.indentSize = spaces <= 2 ? 2 : 4;
                    } else if (this.indentChar === '\t') {
                        this.indentSize = 1;
                    }
                }
                for (let i = 0; i < whitespace.length; i++) {
                    if (whitespace[i] !== this.indentChar) {
                        this.error('Mixed indentation', this.currentLine);
                    }
                }
                return whitespace.length / (this.indentSize || 1);
            }

            parseDocument() {
                const result = {};
                while (this.currentLine < this.lines.length) {
                    const line = this.lines[this.currentLine];
                    if (!line.content || line.content.startsWith('#')) {
                        this.currentLine++;
                        continue;
                    }
                    if (line.indent !== 0) {
                        this.error('Unexpected indentation at document root');
                    }
                    const item = this.parseItem(0);
                    Object.assign(result, item);
                }
                return result;
            }

            parseItem(expectedIndent) {
                const line = this.lines[this.currentLine];
                if (!line || line.indent !== expectedIndent) return null;
                if (line.content.startsWith('#')) {
                    this.currentLine++;
                    return this.parseItem(expectedIndent);
                }
                const rowMatch = line.content.match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*\(([^)]+)\)\s*:$/);
                if (rowMatch) {
                    const key = rowMatch[1];
                    const columns = rowMatch[2].split(',').map(c => c.trim());
                    this.currentLine++;
                    const rows = this.parseRows(expectedIndent + 1, columns);
                    return { [key]: rows };
                }
                const kvMatch = line.content.match(/^([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*:\s*(.*)$/);
                if (!kvMatch) this.error('Expected key-value pair');
                const key = kvMatch[1];
                const valueText = kvMatch[2];
                this.currentLine++;
                if (valueText) {
                    return { [key]: this.parseValue(valueText) };
                }
                const nextLine = this.lines[this.currentLine];
                if (!nextLine || nextLine.indent <= expectedIndent) {
                    return { [key]: null };
                }
                if (nextLine.content.startsWith('-')) {
                    return { [key]: this.parseList(expectedIndent + 1) };
                }
                return { [key]: this.parseObject(expectedIndent + 1) };
            }

            parseObject(expectedIndent) {
                const result = {};
                while (this.currentLine < this.lines.length) {
                    const line = this.lines[this.currentLine];
                    if (!line.content || line.content.startsWith('#')) {
                        this.currentLine++;
                        continue;
                    }
                    if (line.indent < expectedIndent) break;
                    if (line.indent > expectedIndent) this.error('Unexpected indentation');
                    const item = this.parseItem(expectedIndent);
                    if (item) {
                        const newKey = Object.keys(item)[0];
                        if (this.strict && result.hasOwnProperty(newKey)) {
                            this.error(`Duplicate key: ${newKey}`);
                        }
                        Object.assign(result, item);
                    }
                }
                return result;
            }

            parseList(expectedIndent) {
                const result = [];
                while (this.currentLine < this.lines.length) {
                    const line = this.lines[this.currentLine];
                    if (!line.content || line.content.startsWith('#')) {
                        this.currentLine++;
                        continue;
                    }
                    if (line.indent < expectedIndent) break;
                    if (line.indent > expectedIndent) this.error('Unexpected indentation');
                    if (!line.content.startsWith('-')) break;
                    const valueText = line.content.substring(1).trim();
                    this.currentLine++;
                    if (valueText) {
                        result.push(this.parseValue(valueText));
                        continue;
                    }
                    const nextLine = this.lines[this.currentLine];
                    if (nextLine && nextLine.indent > expectedIndent) {
                        result.push(this.parseObject(expectedIndent + 1));
                    } else {
                        result.push(null);
                    }
                }
                return result;
            }

            parseRows(expectedIndent, columns) {
                const result = [];
                while (this.currentLine < this.lines.length) {
                    const line = this.lines[this.currentLine];
                    if (!line.content || line.content.startsWith('#')) {
                        this.currentLine++;
                        continue;
                    }
                    if (line.indent < expectedIndent) break;
                    if (line.indent > expectedIndent) this.error('Unexpected indentation');
                    if (!line.content.startsWith('-')) break;
                    const rowText = line.content.substring(1).trim();
                    this.currentLine++;
                    const values = this.parseRowValues(rowText);
                    if (values.length > columns.length) {
                        if (this.strict) {
                            this.error(`Row has ${values.length} values but header defines ${columns.length} columns`);
                        }
                        values.length = columns.length;
                    }
                    const obj = {};
                    columns.forEach((col, idx) => {
                        obj[col] = idx < values.length ? values[idx] : null;
                    });
                    result.push(obj);
                }
                return result;
            }

            parseRowValues(text) {
                if (!text) return [];
                const values = [];
                let current = '';
                let inQuotes = false;
                let escaped = false;
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (escaped) {
                        current += this.unescapeChar(char);
                        escaped = false;
                        continue;
                    }
                    if (char === '\\' && inQuotes) {
                        escaped = true;
                        continue;
                    }
                    if (char === '"') {
                        inQuotes = !inQuotes;
                        continue;
                    }
                    if (char === ',' && !inQuotes) {
                        values.push(this.parseValue(current.trim()));
                        current = '';
                        continue;
                    }
                    current += char;
                }
                if (current.trim()) {
                    values.push(this.parseValue(current.trim()));
                }
                return values;
            }

            parseValue(text) {
                if (!text) return null;
                if (text.startsWith('"') && text.endsWith('"')) {
                    return this.parseQuotedString(text);
                }
                if (text === 'true') return true;
                if (text === 'false') return false;
                if (text === 'null') return null;
                if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(text)) {
                    return parseFloat(text);
                }
                return text;
            }

            parseQuotedString(text) {
                let result = '';
                let escaped = false;
                text = text.slice(1, -1);
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    if (escaped) {
                        result += this.unescapeChar(char);
                        escaped = false;
                        continue;
                    }
                    if (char === '\\') {
                        escaped = true;
                        continue;
                    }
                    result += char;
                }
                return result;
            }

            unescapeChar(char) {
                const escapes = { 'n': '\n', 'r': '\r', 't': '\t', '\\': '\\', '"': '"' };
                return escapes[char] || char;
            }

            error(message) {
                const line = this.lines[this.currentLine]?.number || 'unknown';
                throw new Error(`Line ${line}: ${message}`);
            }
        }

        function toLean(obj, options = {}) {
            const indent = options.indent || '  ';
            const useRowSyntax = options.useRowSyntax !== false;
            const rowThreshold = options.rowThreshold || 3;

            function toLeanValue(value, level = 0) {
                if (value === null) return 'null';
                if (typeof value === 'boolean') return value.toString();
                if (typeof value === 'number') return value.toString();
                if (typeof value === 'string') {
                    if (/[\s,:#\[\]\{\}]/.test(value) || value === 'true' || value === 'false' || value === 'null') {
                        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
                    }
                    return value;
                }
                if (Array.isArray(value)) return toLeanArray(value, level);
                if (typeof value === 'object') return toLeanObject(value, level);
                return 'null';
            }

            function toLeanArray(arr, level) {
                if (arr.length === 0) return '';
                const prefix = indent.repeat(level + 1);
                if (useRowSyntax && arr.length >= rowThreshold && arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                    const keys = Object.keys(arr[0]);
                    const isUniform = arr.every(item => {
                        const itemKeys = Object.keys(item);
                        return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
                    });
                    if (isUniform && keys.length > 0) {
                        let result = '\n';
                        arr.forEach(item => {
                            const values = keys.map(k => toLeanValue(item[k], level + 1));
                            result += `${prefix}- ${values.join(', ')}\n`;
                        });
                        return result;
                    }
                }
                let result = '\n';
                arr.forEach(item => {
                    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                        result += `${prefix}-\n`;
                        result += toLeanObject(item, level + 2);
                    } else {
                        result += `${prefix}- ${toLeanValue(item, level + 1)}\n`;
                    }
                });
                return result;
            }

            function toLeanObject(obj, level) {
                const prefix = indent.repeat(level);
                let result = '';
                Object.entries(obj).forEach(([key, value]) => {
                    if (useRowSyntax && Array.isArray(value) && value.length >= rowThreshold) {
                        const isUniformObjects = value.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
                        if (isUniformObjects && value.length > 0) {
                            const keys = Object.keys(value[0]);
                            const isUniform = value.every(item => {
                                const itemKeys = Object.keys(item);
                                return itemKeys.length === keys.length && keys.every(k => itemKeys.includes(k));
                            });
                            if (isUniform) {
                                result += `${prefix}${key}(${keys.join(', ')}):\n`;
                                value.forEach(item => {
                                    const values = keys.map(k => toLeanValue(item[k], level + 1));
                                    result += `${indent.repeat(level + 1)}- ${values.join(', ')}\n`;
                                });
                                return;
                            }
                        }
                    }
                    const valueStr = toLeanValue(value, level);
                    if (valueStr.startsWith('\n')) {
                        result += `${prefix}${key}:${valueStr}`;
                    } else {
                        result += `${prefix}${key}: ${valueStr}\n`;
                    }
                });
                return result;
            }

            return toLeanObject(obj, 0).trimEnd();
        }

        // UI Functions
        function convertLeanToJson() {
            const leanInput = document.getElementById('leanInput').value;
            const jsonOutput = document.getElementById('jsonOutput');
            const leanError = document.getElementById('leanError');
            const jsonError = document.getElementById('jsonError');
            const strict = document.getElementById('strictMode').checked;

            leanError.innerHTML = '';
            jsonError.innerHTML = '';

            try {
                const parser = new LeanParser({ strict });
                const result = parser.parse(leanInput);
                jsonOutput.value = JSON.stringify(result, null, 2);
                updateStats();
                showSuccess(jsonError);
            } catch (error) {
                leanError.innerHTML = `<div class="error">${error.message}</div>`;
                jsonOutput.value = '';
            }
        }

        function convertJsonToLean() {
            const jsonOutput = document.getElementById('jsonOutput').value;
            const leanInput = document.getElementById('leanInput');
            const leanError = document.getElementById('leanError');
            const jsonError = document.getElementById('jsonError');
            const useRowSyntax = document.getElementById('useRowSyntax').checked;
            const indentSize = document.getElementById('indentSize').value;

            leanError.innerHTML = '';
            jsonError.innerHTML = '';

            try {
                const obj = JSON.parse(jsonOutput);
                const indent = indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize));
                const lean = toLean(obj, { indent, useRowSyntax });
                leanInput.value = lean;
                updateStats();
                showSuccess(leanError);
            } catch (error) {
                jsonError.innerHTML = `<div class="error">${error.message}</div>`;
                leanInput.value = '';
            }
        }

        function clearAll() {
            document.getElementById('leanInput').value = '';
            document.getElementById('jsonOutput').value = '';
            document.getElementById('leanError').innerHTML = '';
            document.getElementById('jsonError').innerHTML = '';
            updateStats();
        }

        function showSuccess(element) {
            element.innerHTML = '<div class="success">✓ Conversion successful!</div>';
            setTimeout(() => {
                element.innerHTML = '';
            }, 2000);
        }

        function updateStats() {
            const leanInput = document.getElementById('leanInput').value;
            const jsonOutput = document.getElementById('jsonOutput').value;

            document.getElementById('leanLines').textContent = `${leanInput.split('\n').length} lines`;
            document.getElementById('leanChars').textContent = `${leanInput.length} chars`;
            document.getElementById('jsonLines').textContent = `${jsonOutput.split('\n').length} lines`;
            document.getElementById('jsonChars').textContent = `${jsonOutput.length} chars`;
        }

        const examples = {
            simple: `user:
    name: Alice
    age: 30
    email: alice@example.com
    active: true`,

            users: `users(id, name, email, age, active):
    - 1, Alice, alice@example.com, 30, true
    - 2, Bob, bob@example.com, 25, false
    - 3, Casey, casey@example.com, 28, true
    - 4, Dave, dave@example.com, 35, true`,

            products: `store:
    name: TechShop
    location: Boston
    products(id, name, price, stock):
        - 1, "Wireless Mouse", 29.99, 45
        - 2, "Mechanical Keyboard", 89.99, 23
        - 3, "USB-C Hub", 49.99, 67
        - 4, "Laptop Stand", 39.99, 34`,

            blog: `blog:
    title: "Tech Insights"
    author: Alice
    tags:
        - technology
        - programming
        - ai
    posts(id, title, date, views):
        - 1, "Getting Started with LEAN", "2025-01-15", 1250
        - 2, "Why Data Formats Matter", "2025-02-01", 890
        - 3, "Building Better APIs", "2025-02-15", 2100`,

            complex: `company:
    name: "Acme Corp"
    founded: 2020
    departments(id, name):
        - 1, Engineering
        - 2, Marketing
        - 3, Sales
    employees(id, name, dept, salary):
        - 101, Alice, 1, 95000
        - 102, Bob, 1, 87000
        - 103, Casey, 2, 72000
        - 104, Dave, 3, 68000
    offices:
        - city: Boston
          size: 5000
        - city: "New York"
          size: 8000`,

            mixed: `dataset:
    name: "Sample Data"
    version: 1.2
    active: true
    metadata:
        created: "2025-01-15"
        author: Alice
        tags:
            - experimental
            - testing
    records(id, value, status):
        - 1, 42.5, active
        - 2, 38.2, inactive
        - 3, 51.7, active
    summary:
        total: 3
        average: 44.13
        valid: true`
        };

        function loadExample(name) {
            document.getElementById('leanInput').value = examples[name];
            convertLeanToJson();
        }

        // Auto-update stats on input
        document.getElementById('leanInput').addEventListener('input', updateStats);
        document.getElementById('jsonOutput').addEventListener('input', updateStats);

        // Initial stats
        updateStats();

        // Load default example
        loadExample('users');
    </script>
</body>
</html>
