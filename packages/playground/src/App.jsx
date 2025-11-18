import { useEffect, useMemo, useState } from 'react';
import { parse, format } from '@lean/core';
import './styles.css';

const DEFAULT_LEAN = `users(id, name, email, age):
    - 1, Alice, alice@example.com, 30
    - 2, Bob, bob@example.com, 25
    - 3, Casey, casey@example.com, 28`;

const EXAMPLES = {
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

function getIndent(indent) {
    if (indent === 'tab') return '\t';
    const size = Number(indent);
    return Number.isFinite(size) ? ' '.repeat(size) : '  ';
}

export default function App() {
    const [leanInput, setLeanInput] = useState(DEFAULT_LEAN);
    const [jsonOutput, setJsonOutput] = useState('');
    const [strictMode, setStrictMode] = useState(false);
    const [useRowSyntax, setUseRowSyntax] = useState(true);
    const [indent, setIndent] = useState('2');
    const [leanMessage, setLeanMessage] = useState('');
    const [jsonMessage, setJsonMessage] = useState('');

    const stats = useMemo(() => {
        const leanLines = leanInput.split('\n').length;
        const jsonLines = jsonOutput ? jsonOutput.split('\n').length : 0;
        const leanChars = leanInput.length;
        const jsonChars = jsonOutput.length;

        // Calculate combined compactness (weighted average of line and character reduction)
        const lineReduction = leanLines > 0 ? (leanLines - jsonLines) / leanLines * 100 : 0;
        const charReduction = leanChars > 0 ? (leanChars - jsonChars) / leanChars * 100 : 0;

        // Weight characters more heavily (60%) than lines (40%) since character count affects file size more
        const combinedReduction = (lineReduction * 0.4) + (charReduction * 0.6);

        const isLeanMoreCompact = combinedReduction > 0;
        const compactness = Math.abs(combinedReduction).toFixed(1);

        return {
            leanLines,
            leanChars,
            jsonLines,
            jsonChars,
            compactness,
            isLeanMoreCompact,
            lineReduction: lineReduction.toFixed(1),
            charReduction: charReduction.toFixed(1)
        };
    }, [leanInput, jsonOutput]);

    const convertLeanToJson = () => {
        try {
            const result = parse(leanInput, { strict: strictMode });
            setJsonOutput(JSON.stringify(result, null, 2));
            setLeanMessage('');
            setJsonMessage('Converted successfully ✓');
        } catch (error) {
            setJsonOutput('');
            setLeanMessage(error.message);
            setJsonMessage('');
        }
    };

    const convertJsonToLean = () => {
        try {
            const obj = jsonOutput ? JSON.parse(jsonOutput) : {};
            const indentValue = getIndent(indent);
            const result = format(obj, {
                indent: indentValue,
                useRowSyntax
            });
            setLeanInput(result);
            setLeanMessage('Converted successfully ✓');
            setJsonMessage('');
        } catch (error) {
            setJsonMessage(error.message);
            setLeanMessage('');
        }
    };

    const clearAll = () => {
        setLeanInput('');
        setJsonOutput('');
        setLeanMessage('');
        setJsonMessage('');
    };

    const loadExample = (name) => {
        setLeanInput(EXAMPLES[name]);
        setLeanMessage('');
        setJsonMessage('');
    };

    useEffect(() => {
        convertLeanToJson();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="playground-root">
            <div className="container">
                <header>
                    <h1><span>
                            <svg width="40" height="30" viewBox="0 0 30 30">
                        <rect x="0" y="6" width="37" height="3" fill="white" rx="2"/>
                        <rect x="0" y="16" width="28" height="3" fill="white" rx="2" opacity="0.8"/>
                        <rect x="0" y="26" width="16" height="3" fill="white" rx="2" opacity="0.6"/>
                    </svg>
                        </span> LEAN Playground</h1>
                    <p className="subtitle">Lightweight Efficient Adaptive Notation</p>
                </header>

                <div className="main-grid">
                    <section className="panel">
                        <div className="panel-header">
                            <span>LEAN Format</span>
                            <div className="stats">
                                <span className="stat">{stats.leanLines} lines</span>
                                <span className="stat">{stats.leanChars} chars</span>
                                {Math.abs(stats.compactness) > 1 && (
                                    <div
                                        className={`stat compactness ${stats.isLeanMoreCompact ? 'positive' : 'negative'}`}
                                        title={`Lines: ${stats.lineReduction}% reduction | Chars: ${stats.charReduction}% reduction`}
                                    >
                                        {stats.isLeanMoreCompact ? '↓' : '↑'} {stats.compactness}%
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="panel-content">
              <textarea
                  value={leanInput}
                  onChange={(event) => setLeanInput(event.target.value)}
                  placeholder="Enter LEAN here..."
              />
                            {leanMessage && <div className="alert error">{leanMessage}</div>}
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <span>JSON Output</span>
                            <div className="stats">
                                <span className="stat">{stats.jsonLines} lines</span>
                                <span className="stat">{stats.jsonChars} chars</span>
                                {Math.abs(stats.compactness) > 1 && (
                                    <div
                                        className={`stat compactness ${stats.isLeanMoreCompact ? 'negative' : 'positive'}`}
                                        title={`Lines: ${stats.lineReduction}% increase | Chars: ${stats.charReduction}% increase`}
                                    >
                                        {stats.isLeanMoreCompact ? '↑' : '↓'} {stats.compactness}%
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="panel-content">
              <textarea
                  value={jsonOutput}
                  onChange={(event) => setJsonOutput(event.target.value)}
                  placeholder="JSON will appear here..."
              />
                            {jsonMessage && <div className="alert success">{jsonMessage}</div>}
                        </div>
                    </section>
                </div>

                <div className="controls">
                    <button onClick={convertLeanToJson}>LEAN → JSON</button>
                    <button onClick={convertJsonToLean}>JSON → LEAN</button>
                    <button className="secondary" onClick={clearAll}>
                        Clear All
                    </button>
                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={strictMode}
                                onChange={(event) => setStrictMode(event.target.checked)}
                            />
                            Strict mode
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={useRowSyntax}
                                onChange={(event) => setUseRowSyntax(event.target.checked)}
                            />
                            Use row syntax
                        </label>
                        <label>
                            Indent
                            <select value={indent} onChange={(event) => setIndent(event.target.value)}>
                                <option value="2">2 spaces</option>
                                <option value="4">4 spaces</option>
                                <option value="tab">Tab</option>
                            </select>
                        </label>
                    </div>
                </div>

                <section className="examples">
                    <h3>📚 Example Datasets</h3>
                    <div className="example-buttons">
                        {Object.entries({
                            simple: 'Simple Object',
                            users: 'User List',
                            products: 'Product Catalog',
                            blog: 'Blog Structure',
                            complex: 'Complex Nested',
                            mixed: 'Mixed Types'
                        }).map(([key, label]) => (
                            <button
                                key={key}
                                className="example-btn"
                                onClick={() => {
                                    loadExample(key);
                                    setTimeout(convertLeanToJson, 0);
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}