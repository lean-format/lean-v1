import { useEffect, useMemo, useState, useCallback } from 'react';
import { parse, format } from '@lean-format/core';
import './styles.css';

const DEFAULT_LEAN = `users(id, name, email, age):
    - 1, Alice, "alice@example.com", 30
    - 2, Bob, "bob@example.com", 25
    - 3, Casey, "casey@example.com", 28`;

const EXAMPLES = {
    simple: `user:
    name: Alice
    age: 30
    email: "alice@example.com"
    active: true`,

    users: `users(id, name, email, age, active):
    - 1, Alice, "alice@example.com", 30, true
    - 2, Bob, "bob@example.com", 25, false
    - 3, Casey, "casey@example.com", 28, true
    - 4, Dave, "dave@example.com", 35, true`,

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
        - size: 5000`,

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

// Simple timing function
const getTime = () => {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
};

// Enhanced Compactness Indicator Component
const CompactnessIndicator = ({ stats, type }) => {
    if (Math.abs(stats.compactness) < 1) return null;

    const isPositive = type === 'lean' ? stats.isLeanMoreCompact : !stats.isLeanMoreCompact;
    const efficiencyColors = {
        excellent: '#10b981',
        good: '#22c55e',
        moderate: '#eab308',
        slight: '#f59e0b',
        similar: '#6b7280'
    };

    const getEfficiencyText = () => {
        const texts = {
            excellent: 'Highly efficient',
            good: 'Very efficient',
            moderate: 'Moderately efficient',
            slight: 'Slightly efficient',
            similar: 'Similar efficiency'
        };
        return texts[stats.efficiencyLevel];
    };

    return (
        <div
            className={`compactness-indicator ${isPositive ? 'positive' : 'negative'} ${stats.efficiencyLevel}`}
            title={`${getEfficiencyText()}
Lines: ${stats.lineReduction}% ${isPositive ? 'reduction' : 'increase'} (${stats.linesSaved} lines)
Chars: ${stats.charReduction}% ${isPositive ? 'reduction' : 'increase'} (${stats.charsSaved} chars)
Overall: ${stats.compactness}% ${isPositive ? 'more compact' : 'less compact'}`}
        >
            <div className="compactness-bar">
                <div
                    className="compactness-fill"
                    style={{
                        width: `${Math.min(100, stats.compactness)}%`,
                        backgroundColor: efficiencyColors[stats.efficiencyLevel]
                    }}
                />
            </div>
            <div className="compactness-text">
                <span className="icon">
                    {isPositive ? '↓' : '↑'}
                </span>
                {stats.compactness}%
                <span className="efficiency-badge">{stats.efficiencyLevel}</span>
            </div>
        </div>
    );
};

export default function App() {
    const [leanInput, setLeanInput] = useState(DEFAULT_LEAN);
    const [jsonOutput, setJsonOutput] = useState('');
    const [strictMode, setStrictMode] = useState(false);
    const [useRowSyntax, setUseRowSyntax] = useState(true);
    const [indent, setIndent] = useState('2');
    const [leanMessage, setLeanMessage] = useState('');
    const [jsonMessage, setJsonMessage] = useState('');
    const [realTime, setRealTime] = useState(true);
    const [performance, setPerformance] = useState({ parseTime: 0, formatTime: 0 });
    const [history, setHistory] = useState([]);
    const [isConverting, setIsConverting] = useState(false);

    const stats = useMemo(() => {
        const leanLines = leanInput.split('\n').length;
        const jsonLines = jsonOutput ? jsonOutput.split('\n').length : 0;
        const leanChars = leanInput.length;
        const jsonChars = jsonOutput.length;

        // Calculate reductions with better handling of edge cases
        const lineReduction = leanLines > 0 ? ((leanLines - jsonLines) / leanLines) * 100 : 0;
        const charReduction = leanChars > 0 ? ((leanChars - jsonChars) / leanChars) * 100 : 0;

        // Weighted average favoring character reduction (more important for file size)
        const combinedReduction = (lineReduction * 0.3) + (charReduction * 0.7);

        const isLeanMoreCompact = combinedReduction > 0;
        const compactness = Math.abs(combinedReduction);

        // Determine efficiency level
        let efficiencyLevel = 'similar';
        if (compactness > 50) efficiencyLevel = 'excellent';
        else if (compactness > 25) efficiencyLevel = 'good';
        else if (compactness > 10) efficiencyLevel = 'moderate';
        else if (compactness > 2) efficiencyLevel = 'slight';

        return {
            leanLines,
            leanChars,
            jsonLines,
            jsonChars,
            compactness: compactness.toFixed(1),
            efficiencyLevel,
            isLeanMoreCompact,
            lineReduction: lineReduction.toFixed(1),
            charReduction: charReduction.toFixed(1),
            // Add absolute savings
            linesSaved: Math.abs(leanLines - jsonLines),
            charsSaved: Math.abs(leanChars - jsonChars)
        };
    }, [leanInput, jsonOutput]);

    const addToHistory = useCallback((from, to, direction) => {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date(),
            direction,
            from: from.substring(0, 100) + (from.length > 100 ? '...' : ''),
            to: to.substring(0, 100) + (to.length > 100 ? '...' : ''),
            stats: { ...stats }
        };
        setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    }, [stats]);

    const parseErrorMessage = useCallback((error) => {
        if (error.message.includes('line')) {
            const match = error.message.match(/line (\d+)/);
            return match ? `Error on line ${match[1]}: ${error.message}` : error.message;
        }
        return error.message;
    }, []);

    const convertLeanToJson = useCallback(async () => {
        if (isConverting) return;

        setIsConverting(true);
        try {
            const start = getTime();
            const result = parse(leanInput, { strict: strictMode });
            const jsonString = JSON.stringify(result, null, 2);
            const end = getTime();

            setJsonOutput(jsonString);
            setLeanMessage('');
            setJsonMessage('✓ Converted successfully');
            setPerformance(prev => ({ ...prev, parseTime: end - start }));
            addToHistory(leanInput, jsonString, 'leanToJson');
        } catch (error) {
            setJsonOutput('');
            setLeanMessage(parseErrorMessage(error));
            setJsonMessage('');
        } finally {
            setIsConverting(false);
        }
    }, [leanInput, strictMode, addToHistory, parseErrorMessage, isConverting]);

    const convertJsonToLean = useCallback(async () => {
        if (isConverting) return;

        setIsConverting(true);
        try {
            const start = getTime();
            const obj = jsonOutput ? JSON.parse(jsonOutput) : {};
            const indentValue = getIndent(indent);
            const result = format(obj, {
                indent: indentValue,
                useRowSyntax
            });
            const end = getTime();

            setLeanInput(result);
            setLeanMessage('✓ Converted successfully');
            setJsonMessage('');
            setPerformance(prev => ({ ...prev, formatTime: end - start }));
            addToHistory(jsonOutput, result, 'jsonToLean');
        } catch (error) {
            setJsonMessage(parseErrorMessage(error));
            setLeanMessage('');
        } finally {
            setIsConverting(false);
        }
    }, [jsonOutput, indent, useRowSyntax, addToHistory, parseErrorMessage, isConverting]);

    const clearAll = () => {
        setLeanInput('');
        setJsonOutput('');
        setLeanMessage('');
        setJsonMessage('');
        setHistory([]);
        setPerformance({ parseTime: 0, formatTime: 0 });
    };

    const loadExample = (name) => {
        setLeanInput(EXAMPLES[name]);
        setLeanMessage('');
        setJsonMessage('');
    };

    const importFile = (event, type) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (type === 'lean') {
                    setLeanInput(e.target.result);
                } else {
                    setJsonOutput(e.target.result);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input
        event.target.value = '';
    };

    const exportFile = (content, filename) => {
        if (!content.trim()) {
            alert('No content to export!');
            return;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Real-time conversion effect
    useEffect(() => {
        if (realTime && leanInput.trim()) {
            const timeoutId = setTimeout(convertLeanToJson, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [leanInput, realTime, convertLeanToJson]);

    // Initial conversion
    useEffect(() => {
        convertLeanToJson();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="playground-root">
            <div className="container">
                <header>
                    <h1>
                        <span>
                            <svg width="40" height="30" viewBox="0 0 30 30">
                                <rect x="0" y="6" width="37" height="3" fill="white" rx="2"/>
                                <rect x="0" y="16" width="28" height="3" fill="white" rx="2" opacity="0.8"/>
                                <rect x="0" y="26" width="16" height="3" fill="white" rx="2" opacity="0.6"/>
                            </svg>
                        </span> LEAN Playground
                    </h1>
                    <p className="subtitle">Lightweight Efficient Adaptive Notation</p>
                </header>

                <div className="main-grid">
                    <section className="panel">
                        <div className="panel-header">
                            <span>LEAN Format</span>
                            <div className="stats">
                                <span className="stat">{stats.leanLines} lines</span>
                                <span className="stat">{stats.leanChars} chars</span>
                                <CompactnessIndicator stats={stats} type="lean" />
                            </div>
                        </div>
                        <div className="panel-content">
                            <textarea
                                value={leanInput}
                                onChange={(event) => setLeanInput(event.target.value)}
                                placeholder="Enter LEAN here..."
                                spellCheck={false}
                                disabled={isConverting}
                            />
                            {leanMessage && (
                                <div className="alert error">
                                    <strong>Conversion Error:</strong><br />
                                    {leanMessage}
                                </div>
                            )}
                            {isConverting && <div className="converting-overlay">Converting...</div>}
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <span>JSON Output</span>
                            <div className="stats">
                                <span className="stat">{stats.jsonLines} lines</span>
                                <span className="stat">{stats.jsonChars} chars</span>
                                <CompactnessIndicator stats={stats} type="json" />
                            </div>
                        </div>
                        <div className="panel-content">
                            <textarea
                                value={jsonOutput}
                                onChange={(event) => setJsonOutput(event.target.value)}
                                placeholder="JSON will appear here..."
                                spellCheck={false}
                                disabled={isConverting}
                            />
                            {jsonMessage && (
                                <div className="alert success">
                                    {jsonMessage}
                                </div>
                            )}
                            {isConverting && <div className="converting-overlay">Converting...</div>}
                        </div>
                    </section>
                </div>

                <div className="controls">
                    <div className="conversion-buttons">
                        <button
                            onClick={convertLeanToJson}
                            disabled={isConverting || !leanInput.trim()}
                        >
                            {isConverting ? 'Converting...' : 'LEAN → JSON'}
                        </button>
                        <button
                            onClick={convertJsonToLean}
                            disabled={isConverting || !jsonOutput.trim()}
                        >
                            {isConverting ? 'Converting...' : 'JSON → LEAN'}
                        </button>
                        <button className="secondary" onClick={clearAll}>
                            Clear All
                        </button>
                    </div>

                    <div className="file-actions">
                        <label className="file-btn">
                            📁 Import LEAN
                            <input
                                type="file"
                                accept=".lean,.txt"
                                onChange={(e) => importFile(e, 'lean')}
                                hidden
                                disabled={isConverting}
                            />
                        </label>
                        <label className="file-btn">
                            📁 Import JSON
                            <input
                                type="file"
                                accept=".json,.txt"
                                onChange={(e) => importFile(e, 'json')}
                                hidden
                                disabled={isConverting}
                            />
                        </label>
                        <button
                            onClick={() => exportFile(leanInput, 'data.lean')}
                            disabled={!leanInput.trim()}
                        >
                            Export LEAN
                        </button>
                        <button
                            onClick={() => exportFile(jsonOutput, 'data.json')}
                            disabled={!jsonOutput.trim()}
                        >
                            Export JSON
                        </button>
                    </div>

                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={strictMode}
                                onChange={(event) => setStrictMode(event.target.checked)}
                                disabled={isConverting}
                            />
                            Strict mode
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={useRowSyntax}
                                onChange={(event) => setUseRowSyntax(event.target.checked)}
                                disabled={isConverting}
                            />
                            Use row syntax
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={realTime}
                                onChange={(event) => setRealTime(event.target.checked)}
                                disabled={isConverting}
                            />
                            Real-time conversion
                        </label>
                        <label>
                            Indent
                            <select
                                value={indent}
                                onChange={(event) => setIndent(event.target.value)}
                                disabled={isConverting}
                            >
                                <option value="2">2 spaces</option>
                                <option value="4">4 spaces</option>
                                <option value="tab">Tab</option>
                            </select>
                        </label>
                    </div>

                    <div className="performance">
                        <span className="stat">Parse: {performance.parseTime.toFixed(1)}ms</span>
                        <span className="stat">Format: {performance.formatTime.toFixed(1)}ms</span>
                    </div>
                </div>

                {history.length > 0 && (
                    <section className="history">
                        <h3>📜 Conversion History (Last 10)</h3>
                        <div className="history-list">
                            {history.map((item) => (
                                <div key={item.id} className="history-item">
                                    <div className="history-direction">
                                        {item.direction === 'leanToJson' ? 'LEAN → JSON' : 'JSON → LEAN'}
                                    </div>
                                    <div className="history-preview">
                                        "{item.from}" → "{item.to}"
                                    </div>
                                    <div className="history-time">
                                        {item.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

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
                                    if (!realTime) {
                                        setTimeout(convertLeanToJson, 0);
                                    }
                                }}
                                disabled={isConverting}
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