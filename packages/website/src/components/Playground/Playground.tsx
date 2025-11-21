'use client';

import { useMemo, useState } from 'react';
import { parse, format } from '@lean-format/core';

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

export default function Playground() {
    const [input, setInput] = useState(DEFAULT_LEAN);
    const [error, setError] = useState('');
    const [inputMode, setInputMode] = useState('lean');
    const [outputMode, setOutputMode] = useState('json');
    const [indent, setIndent] = useState(4);
    const [useTabs, setUseTabs] = useState(false);
    const [copiedInput, setCopiedInput] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleExampleSelect = (exampleKey) => {
        if (exampleKey) {
            setInput(EXAMPLES[exampleKey]);
            setInputMode('lean');
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
            return '';
        }

        try {
            let parsed;

            if (inputMode === 'lean') {
                parsed = parse(input);
            } else {
                parsed = JSON.parse(input);
            }

            if (outputMode === 'lean') {
                const formatted = format(parsed, {
                    indent: useTabs ? '\t' : ' '.repeat(indent),
                    useRowSyntax: true,
                    rowThreshold: 3
                });
                setError('');
                return formatted;
            } else {
                setError('');
                return JSON.stringify(parsed, null, 2);
            }
        } catch (err) {
            setError(err.message);
            return '';
        }
    }, [input, inputMode, outputMode, indent, useTabs]);

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
        }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>LEAN Playground</h1>
                <p style={{
                    fontSize: '0.9rem',
                    color: '#718096',
                    marginBottom: '1rem'
                }}>
                    Visit <a
                    href="#"
                    style={{
                        color: '#3182ce',
                        textDecoration: 'none',
                        fontWeight: '500'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                    }}
                >
                    [Hosted Playground]
                </a> for more playground functionality and insight
                </p>
                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#4a5568' }}>Examples:</label>
                        <select
                            onChange={(e) => handleExampleSelect(e.target.value)}
                            style={{
                                padding: '0.25rem 0.5rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Select an example</option>
                            <option value="simple">Simple Object</option>
                            <option value="users">User List</option>
                            <option value="nested">Nested Structure</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                            Indent:
                            <input
                                type="number"
                                min="1"
                                max="8"
                                value={indent}
                                onChange={handleIndentChange}
                                disabled={useTabs}
                                style={{
                                    width: '60px',
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    marginLeft: '0.5rem'
                                }}
                            />
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                            <input
                                type="checkbox"
                                checked={useTabs}
                                onChange={handleTabChange}
                                style={{ marginRight: '0.5rem' }}
                            />
                            Use tabs
                        </label>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                height: '70vh'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 1rem',
                        background: '#f7fafc',
                        borderBottom: '1px solid #e2e8f0',
                        height: '48px'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1rem', color: '#4a5568' }}>Input</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                onClick={() => copyToClipboard(input, true)}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    background: copiedInput ? '#48bb78' : 'white',
                                    color: copiedInput ? 'white' : '#4a5568',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {copiedInput ? '✓ Copied' : '📋 Copy'}
                            </button>
                            <button
                                onClick={() => setInputMode('lean')}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    background: inputMode === 'lean' ? '#3182ce' : 'white',
                                    color: inputMode === 'lean' ? 'white' : 'inherit',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                LEAN
                            </button>
                            <button
                                onClick={() => setInputMode('json')}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    background: inputMode === 'json' ? '#3182ce' : 'white',
                                    color: inputMode === 'json' ? 'white' : 'inherit',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                JSON
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        spellCheck="false"
                        style={{
                            flex: 1,
                            padding: '1rem',
                            border: 'none',
                            resize: 'none',
                            fontFamily: '"Fira Code", "Courier New", Courier, monospace',
                            fontSize: '0.9rem',
                            lineHeight: '1.5',
                            background: 'white',
                            color: '#2d3748'
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 1rem',
                        background: '#f7fafc',
                        borderBottom: '1px solid #e2e8f0',
                        height: '48px'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1rem', color: '#4a5568' }}>Output</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                onClick={() => copyToClipboard(output, false)}
                                disabled={!!error || !output}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    background: copiedOutput ? '#48bb78' : (error || !output ? '#f7fafc' : 'white'),
                                    color: copiedOutput ? 'white' : (error || !output ? '#cbd5e0' : '#4a5568'),
                                    borderRadius: '4px',
                                    cursor: error || !output ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {copiedOutput ? '✓ Copied' : '📋 Copy'}
                            </button>
                            <button
                                onClick={() => setOutputMode('lean')}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    background: outputMode === 'lean' ? '#3182ce' : 'white',
                                    color: outputMode === 'lean' ? 'white' : 'inherit',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                LEAN
                            </button>
                            <button
                                onClick={() => setOutputMode('json')}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #e2e8f0',
                                    background: outputMode === 'json' ? '#3182ce' : 'white',
                                    color: outputMode === 'json' ? 'white' : 'inherit',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                JSON
                            </button>
                        </div>
                    </div>
                    <div style={{
                        flex: 1,
                        padding: '1rem',
                        overflow: 'auto',
                        background: 'white'
                    }}>
                        {error ? (
                            <div style={{
                                color: '#e53e3e',
                                padding: '1rem',
                                background: '#fff5f5',
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
                                color: '#2d3748'
                            }}>
                                {output}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}