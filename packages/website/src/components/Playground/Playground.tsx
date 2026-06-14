'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { parse, format, validate } from '@lean-format/core';

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
    - 3, Casey, "casey@example.com", 28, true`,

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

    nested: `blog:
    title: "My Blog"
    author:
        name: Alice
        email: "alice@example.com"
    posts(id, title, content):
        - 1, "First Post", "Hello, world!"
        - 2, "Second Post", "Another post"
    tags:
        - tech
        - programming
        - blog`
};

const lineNumbers = (text) => {
    const count = (text || '').split('\n').length;
    return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1);
};

function LineNumbers({ text, errorLine, style }) {
    const nums = lineNumbers(text);
    return (
        <div aria-hidden="true" style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem 0',
            textAlign: 'right',
            userSelect: 'none',
            fontFamily: '"Fira Code", "Courier New", Courier, monospace',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            color: '#a0aec0',
            minWidth: '3rem',
            overflow: 'hidden',
            ...style
        }}>
            {nums.map(n => (
                <div
                    key={n}
                    style={{
                        padding: '0 0.75rem 0 0',
                        background: errorLine === n ? '#fed7d7' : 'transparent',
                        color: errorLine === n ? '#e53e3e' : 'inherit',
                        fontWeight: errorLine === n ? '700' : '400'
                    }}
                >
                    {n}
                </div>
            ))}
        </div>
    );
}

function extractLineNumber(message) {
    const m = message.match(/line\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
}

const STORAGE_DARK_KEY = 'lean-playground-dark';

export default function Playground() {
    const [input, setInput] = useState(DEFAULT_LEAN);
    const [error, setError] = useState('');
    const [inputMode, setInputMode] = useState('lean');
    const [outputMode, setOutputMode] = useState('json');
    const [indent, setIndent] = useState(4);
    const [useTabs, setUseTabs] = useState(false);
    const [copiedInput, setCopiedInput] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const [strictMode, setStrictMode] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_DARK_KEY) === 'true';
        }
        return false;
    });
    const [perfMetrics, setPerfMetrics] = useState<{ parse: string; format: string } | null>(null);
    const [realTime, setRealTime] = useState(true);
    const [errorLine, setErrorLine] = useState<number | null>(null);

    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyDarkClass = useCallback((val) => {
        if (typeof document !== 'undefined') {
            document.body.classList.toggle('lean-dark', val);
        }
    }, []);

    useEffect(() => {
        applyDarkClass(darkMode);
        localStorage.setItem(STORAGE_DARK_KEY, String(darkMode));
    }, [darkMode, applyDarkClass]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        setErrorLine(null);
        if (realTime) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                runConversion(val);
            }, 500);
        }
    };

    const runConversion = useCallback((val) => {
        const text = val !== undefined ? val : input;
        if (!text.trim()) {
            setError('');
            setPerfMetrics(null);
            setErrorLine(null);
            return;
        }
        const t0 = window.performance.now();
        try {
            let parsed;
            if (inputMode === 'lean') {
                parsed = parse(text);
                if (strictMode) {
                    validate(parsed);
                }
            } else {
                parsed = JSON.parse(text);
            }
            const t1 = window.performance.now();
            if (outputMode === 'lean') {
                format(parsed, {
                    indent: useTabs ? '\t' : ' '.repeat(indent),
                    useRowSyntax: true,
                    rowThreshold: 3
                });
            } else {
                JSON.stringify(parsed, null, 2);
            }
            const t2 = window.performance.now();
            setError('');
            setErrorLine(null);
            setPerfMetrics({ parse: (t1 - t0).toFixed(2), format: (t2 - t1).toFixed(2) });
        } catch (err) {
            const line = extractLineNumber(err.message);
            setErrorLine(line);
            setError(err.message);
            setPerfMetrics(null);
            if (line && inputRef.current) {
                inputRef.current.scrollTop = Math.max(0, (line - 1) * 22 - 60);
            }
        }
    }, [input, inputMode, outputMode, indent, useTabs, strictMode]);

    const handleConvert = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        runConversion(input);
    }, [runConversion, input]);

    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleConvert();
            }
            if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                toggleDark();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleConvert, toggleDark]);

    const handleExampleSelect = (exampleKey) => {
        if (exampleKey) {
            setInput(EXAMPLES[exampleKey]);
            setInputMode('lean');
            setError('');
            setErrorLine(null);
            setPerfMetrics(null);
        }
    };

    const handleIndentChange = (e) => {
        setIndent(parseInt(e.target.value, 10));
    };

    const handleTabChange = (e) => {
        setUseTabs(e.target.checked);
    };

    const copyToClipboard = async (text, isInput) => {
        try {
            await navigator.clipboard.writeText(text);
            if (isInput) {
                setCopiedInput(true);
                setTimeout(() => setCopiedInput(false), 2000);
            } else {
                setCopiedOutput(true);
                setTimeout(() => setCopiedOutput(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const output = useMemo(() => {
        if (!input.trim()) {
            setError('');
            setPerfMetrics(null);
            return '';
        }
        const t0 = window.performance.now();
        try {
            let parsed;
            if (inputMode === 'lean') {
                parsed = parse(input);
                if (strictMode) {
                    validate(parsed);
                }
            } else {
                parsed = JSON.parse(input);
            }
            const t1 = window.performance.now();
            let result;
            if (outputMode === 'lean') {
                result = format(parsed, {
                    indent: useTabs ? '\t' : ' '.repeat(indent),
                    useRowSyntax: true,
                    rowThreshold: 3
                });
            } else {
                result = JSON.stringify(parsed, null, 2);
            }
            const t2 = window.performance.now();
            setError('');
            setErrorLine(null);
            setPerfMetrics({ parse: (t1 - t0).toFixed(2), format: (t2 - t1).toFixed(2) });
            return result;
        } catch (err) {
            const line = extractLineNumber(err.message);
            setErrorLine(line);
            setError(err.message);
            setPerfMetrics(null);
            if (line && inputRef.current) {
                inputRef.current.scrollTop = Math.max(0, (line - 1) * 22 - 60);
            }
            return '';
        }
    }, [input, inputMode, outputMode, indent, useTabs, strictMode]);

    const toggleDark = () => setDarkMode(prev => !prev);

    const base = {
        bg: darkMode ? '#1a202c' : '#ffffff',
        bgPanel: darkMode ? '#2d3748' : '#ffffff',
        bgHeader: darkMode ? '#1a202c' : '#f7fafc',
        text: darkMode ? '#e2e8f0' : '#2d3748',
        textMuted: darkMode ? '#a0aec0' : '#718096',
        textStrong: darkMode ? '#f7fafc' : '#2d3748',
        border: darkMode ? '#4a5568' : '#e2e8f0',
        errorBg: darkMode ? '#4a2020' : '#fff5f5',
        accent: '#3182ce',
        shadow: darkMode ? '0 2px 10px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0, 0, 0, 0.1)',
    };

    return (
        <>
            <style>{`
                body.lean-dark {
                    background: #1a202c;
                }
                .lean-dark ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .lean-dark ::-webkit-scrollbar-track {
                    background: #2d3748;
                }
                .lean-dark ::-webkit-scrollbar-thumb {
                    background: #4a5568;
                    border-radius: 4px;
                }
                .lean-dark ::-webkit-scrollbar-thumb:hover {
                    background: #718096;
                }
            `}</style>
            <div role="application" aria-label="LEAN Playground Lite" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '2rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
            }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ color: base.textStrong, margin: 0 }}>LEAN Playground Lite</h1>
                        <button
                            onClick={toggleDark}
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            style={{
                                padding: '0.35rem 0.75rem',
                                border: `1px solid ${base.border}`,
                                background: base.bgPanel,
                                color: base.text,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {darkMode ? 'Light' : 'Dark'}
                        </button>
                    </div>
                    <p style={{
                        fontSize: '0.9rem',
                        color: base.textMuted,
                        marginBottom: '1rem'
                    }}>
                        Experience the full power of LEAN in our <a
                            href="https://lean-format.github.io/lean-v1/playground/"
                            style={{
                                color: '#e53e3e',
                                textDecoration: 'none',
                                fontWeight: '500'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseOut={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                            aria-label="Open advanced playground"
                        >
                            [Advanced Playground]
                        </a>
                    </p>
                    <div role="toolbar" aria-label="Playground settings" style={{
                        display: 'flex',
                        gap: '1.5rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label htmlFor="example-select" style={{ fontSize: '0.9rem', color: base.textMuted }}>Examples:</label>
                            <select
                                id="example-select"
                                onChange={(e) => handleExampleSelect(e.target.value)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    border: `1px solid ${base.border}`,
                                    borderRadius: '4px',
                                    backgroundColor: base.bgPanel,
                                    color: base.text
                                }}
                            >
                                <option value="">Select an example</option>
                                <option value="simple">Simple Object</option>
                                <option value="users">User List</option>
                                <option value="nested">Nested Structure</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label htmlFor="indent-input" style={{ fontSize: '0.9rem', color: base.textMuted }}>
                                Indent:
                                <input
                                    id="indent-input"
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={indent}
                                    onChange={handleIndentChange}
                                    disabled={useTabs}
                                    aria-label="Indentation size"
                                    style={{
                                        width: '60px',
                                        padding: '0.25rem 0.5rem',
                                        border: `1px solid ${base.border}`,
                                        borderRadius: '4px',
                                        marginLeft: '0.5rem',
                                        backgroundColor: base.bgPanel,
                                        color: base.text
                                    }}
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: base.textMuted }}>
                                <input
                                    type="checkbox"
                                    checked={useTabs}
                                    onChange={handleTabChange}
                                    aria-label="Use tabs for indentation"
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Use tabs
                            </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: base.textMuted }}>
                                <input
                                    type="checkbox"
                                    checked={strictMode}
                                    onChange={(e) => setStrictMode(e.target.checked)}
                                    aria-label="Enable strict mode"
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Strict
                            </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: base.textMuted }}>
                                <input
                                    type="checkbox"
                                    checked={realTime}
                                    onChange={(e) => setRealTime(e.target.checked)}
                                    aria-label="Enable real-time conversion"
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Auto
                            </label>
                        </div>
                        <button
                            onClick={handleConvert}
                            aria-label="Convert"
                            title="Ctrl+Enter to convert"
                            style={{
                                padding: '0.25rem 1rem',
                                border: 'none',
                                background: base.accent,
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                            }}
                        >
                            Convert
                        </button>
                    </div>
                    {perfMetrics && (
                        <div style={{
                            fontSize: '0.8rem',
                            color: base.textMuted,
                            marginBottom: '0.75rem',
                            fontFamily: 'monospace'
                        }}>
                            parse: {perfMetrics.parse}ms &nbsp;|&nbsp; format: {perfMetrics.format}ms
                        </div>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem',
                    height: '70vh'
                }}>
                    <section aria-label="Input editor" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: base.bgPanel,
                        borderRadius: '8px',
                        boxShadow: base.shadow,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 1rem',
                            background: base.bgHeader,
                            borderBottom: `1px solid ${base.border}`,
                            height: '48px'
                        }}>
                            <h2 id="input-label" style={{ margin: 0, fontSize: '1rem', color: base.text }}>Input</h2>
                            <div role="toolbar" aria-label="Input controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => copyToClipboard(input, true)}
                                    aria-label={copiedInput ? 'Copied' : 'Copy input'}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        border: `1px solid ${base.border}`,
                                        background: copiedInput ? '#48bb78' : base.bgPanel,
                                        color: copiedInput ? 'white' : base.text,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {copiedInput ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setInputMode('lean')}
                                    aria-pressed={inputMode === 'lean'}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        border: `1px solid ${base.border}`,
                                        background: inputMode === 'lean' ? base.accent : base.bgPanel,
                                        color: inputMode === 'lean' ? 'white' : base.text,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    LEAN
                                </button>
                                <button
                                    onClick={() => setInputMode('json')}
                                    aria-pressed={inputMode === 'json'}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        border: `1px solid ${base.border}`,
                                        background: inputMode === 'json' ? base.accent : base.bgPanel,
                                        color: inputMode === 'json' ? 'white' : base.text,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    JSON
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            <LineNumbers
                                text={input}
                                errorLine={errorLine}
                                style={{
                                    background: darkMode ? '#1a202c' : '#f7fafc',
                                    borderRight: `1px solid ${base.border}`
                                }}
                            />
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                spellCheck="false"
                                aria-labelledby="input-label"
                                style={{
                                    flex: 1,
                                    padding: '1rem 0.75rem',
                                    border: 'none',
                                    resize: 'none',
                                    fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    background: base.bgPanel,
                                    color: base.text,
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </section>

                    <section aria-label="Output display" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: base.bgPanel,
                        borderRadius: '8px',
                        boxShadow: base.shadow,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 1rem',
                            background: base.bgHeader,
                            borderBottom: `1px solid ${base.border}`,
                            height: '48px'
                        }}>
                            <h2 id="output-label" style={{ margin: 0, fontSize: '1rem', color: base.text }}>Output</h2>
                            <div role="toolbar" aria-label="Output controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => copyToClipboard(output, false)}
                                    disabled={!!error || !output}
                                    aria-label={copiedOutput ? 'Copied' : 'Copy output'}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        border: `1px solid ${base.border}`,
                                        background: copiedOutput ? '#48bb78' : (error || !output ? base.bgHeader : base.bgPanel),
                                        color: copiedOutput ? 'white' : (error || !output ? '#718096' : base.text),
                                        borderRadius: '4px',
                                        cursor: error || !output ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {copiedOutput ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setOutputMode('lean')}
                                    aria-pressed={outputMode === 'lean'}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        border: `1px solid ${base.border}`,
                                        background: outputMode === 'lean' ? base.accent : base.bgPanel,
                                        color: outputMode === 'lean' ? 'white' : base.text,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    LEAN
                                </button>
                                <button
                                    onClick={() => setOutputMode('json')}
                                    aria-pressed={outputMode === 'json'}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        border: `1px solid ${base.border}`,
                                        background: outputMode === 'json' ? base.accent : base.bgPanel,
                                        color: outputMode === 'json' ? 'white' : base.text,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    JSON
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            <LineNumbers
                                text={error ? '' : output}
                                errorLine={null}
                                style={{
                                    background: darkMode ? '#1a202c' : '#f7fafc',
                                    borderRight: `1px solid ${base.border}`
                                }}
                            />
                            <div style={{
                                flex: 1,
                                padding: '1rem 0.75rem',
                                overflow: 'auto',
                                background: base.bgPanel
                            }} role="region" aria-live="polite" aria-labelledby="output-label">
                                {error ? (
                                    <div role="alert" style={{
                                        color: '#e53e3e',
                                        padding: '0.5rem',
                                        background: base.errorBg,
                                        borderRadius: '4px',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5'
                                    }}>
                                        {error}
                                    </div>
                                ) : (
                                    <pre style={{
                                        margin: 0,
                                        fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        color: base.text
                                    }}>
                                        {output}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <footer style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: base.textMuted
                }}>
                    Ctrl+Enter to convert &nbsp;|&nbsp; Ctrl+D dark mode &nbsp;|&nbsp; Tab indentation &nbsp;|&nbsp; {realTime ? 'Auto-convert enabled' : 'Manual convert'}
                </footer>
            </div>
        </>
    );
}
