import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { parse, format, validate, query, generateSchema } from '@lean-format/core';
import logo from './assets/logo.png';
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
    - 3, Casey, "casey@example.com", 28, true`,
  products: `store:
    name: TechShop
    location: Boston
    products(id, name, price, stock):
        - 1, "Wireless Mouse", 29.99, 45
        - 2, "Mechanical Keyboard", 89.99, 23
        - 3, "USB-C Hub", 49.99, 67`,
  blog: `blog:
    title: "Tech Insights"
    author: Alice
    tags:
        - technology
        - programming
        - ai
    posts(id, title, date, views):
        - 1, "Getting Started with LEAN", "2025-01-15", 1250
        - 2, "Why Data Formats Matter", "2025-02-01", 890`,
  complex: `company:
    name: "Acme Corp"
    founded: 2020
    departments(id, name):
        - 1, Engineering
        - 2, Marketing
    employees(id, name, dept, salary):
        - 101, Alice, 1, 95000
        - 102, Bob, 1, 87000`,
};

const getTime = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function parseErrorInfo(err) {
  const msg = err.message || String(err);
  const lineMatch = msg.match(/line (\d+)/i);
  const colMatch = msg.match(/column (\d+)/i);
  return {
    message: msg,
    line: lineMatch ? parseInt(lineMatch[1]) : null,
    column: colMatch ? parseInt(colMatch[1]) : null,
  };
}

function useKeyboard(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      for (const { key, ctrl, meta, shift, handler: h } of shortcuts) {
        const mod = ctrl || meta;
        if ((mod && (e.ctrlKey || e.metaKey) && e.key === key) ||
            (!mod && e.key === key && !shift && !e.ctrlKey && !e.metaKey)) {
          if (!shift === !e.shiftKey) {
            e.preventDefault();
            h(e);
            return;
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

function LineNumbers({ text, errorLine }) {
  const count = text ? text.split('\n').length : 1;
  return (
    <div className="line-numbers" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`line-number${i + 1 === errorLine ? ' error' : ''}`}>
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function CompactnessIndicator({ stats }) {
  if (Math.abs(stats.compactness) < 1) return null;
  const isPositive = stats.isLeanMoreCompact;
  const colors = {
    excellent: '#10b981', good: '#22c55e', moderate: '#eab308', slight: '#f59e0b', similar: '#6b7280',
  };
  const label = isPositive
    ? { excellent: 'Highly efficient', good: 'Very efficient', moderate: 'Moderately efficient', slight: 'Slightly efficient', similar: 'Similar efficiency' }[stats.efficiencyLevel]
    : 'Less compact';
  return (
    <div className={`compactness-indicator ${isPositive ? 'positive' : 'negative'} ${stats.efficiencyLevel}`}
         title={`${label}\nLines: ${stats.lineReduction}% ${isPositive ? 'reduction' : 'increase'} (${stats.linesSaved} lines)\nChars: ${stats.charReduction}% ${isPositive ? 'reduction' : 'increase'} (${stats.charsSaved} chars)\nOverall: ${stats.compactness}% ${isPositive ? 'more compact' : 'less compact'}`}>
      <div className="compactness-bar">
        <div className="compactness-fill" style={{ width: `${Math.min(100, stats.compactness)}%`, backgroundColor: colors[stats.efficiencyLevel] }} />
      </div>
      <div className="compactness-text">
        <span className="icon">{isPositive ? '\u2193' : '\u2191'}</span>
        {stats.compactness}%
        <span className="efficiency-badge">{isPositive ? stats.efficiencyLevel : 'bloated'}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [leanInput, setLeanInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const [indent, setIndent] = useState('2');
  const [leanMessage, setLeanMessage] = useState('');
  const [jsonMessage, setJsonMessage] = useState('');
  const [realTime, setRealTime] = useState(true);
  const [performance, setPerformance] = useState({ parseTime: 0, formatTime: 0 });
  const [history, setHistory] = useState([]);
  const [converting, setConverting] = useState({ leanToJson: false, jsonToLean: false });
  const [errorLine, setErrorLine] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('lean-dark') === 'true');
  const [showSchema, setShowSchema] = useState(false);
  const [schemaResult, setSchemaResult] = useState('');
  const leanTextareaRef = useRef(null);
  const jsonTextareaRef = useRef(null);
  const leanContainerRef = useRef(null);

  // URL sharing
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const decoded = atob(decodeURIComponent(hash));
        const state = JSON.parse(decoded);
        if (state.lean) setLeanInput(state.lean);
        if (state.strict !== undefined) setStrictMode(state.strict);
        if (state.indent) setIndent(state.indent);
      } else {
        setLeanInput(DEFAULT_LEAN);
      }
    } catch {
      setLeanInput(DEFAULT_LEAN);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const state = JSON.stringify({ lean: leanInput, strict: strictMode, indent });
        const hash = encodeURIComponent(btoa(state));
        window.location.hash = hash;
      } catch { /* ignore */ }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [leanInput, strictMode, indent]);

  const stats = useMemo(() => {
    const leanLines = leanInput.split('\n').length;
    const jsonLines = jsonOutput ? jsonOutput.split('\n').length : 0;
    const leanChars = leanInput.length;
    const jsonChars = jsonOutput.length;
    const lineReduction = leanLines > 0 ? ((leanLines - jsonLines) / leanLines) * 100 : 0;
    const charReduction = leanChars > 0 ? ((leanChars - jsonChars) / leanChars) * 100 : 0;
    const combined = lineReduction * 0.3 + charReduction * 0.7;
    const isLeanMoreCompact = combined < 0;
    const compactness = Math.abs(combined);
    let efficiencyLevel = 'similar';
    if (compactness > 50) efficiencyLevel = 'excellent';
    else if (compactness > 25) efficiencyLevel = 'good';
    else if (compactness > 10) efficiencyLevel = 'moderate';
    else if (compactness > 2) efficiencyLevel = 'slight';
    return { leanLines, leanChars, jsonLines, jsonChars, compactness: compactness.toFixed(1), efficiencyLevel, isLeanMoreCompact, lineReduction: lineReduction.toFixed(1), charReduction: charReduction.toFixed(1), linesSaved: Math.abs(leanLines - jsonLines), charsSaved: Math.abs(leanChars - jsonChars) };
  }, [leanInput, jsonOutput]);

  const addToHistory = useCallback((direction) => {
    setHistory(prev => [{ id: Date.now(), timestamp: new Date(), direction, stats: { ...stats } }, ...prev.slice(0, 9)]);
  }, [stats]);

  const convertLeanToJson = useCallback(async () => {
    if (!leanInput.trim()) return;
    setConverting(p => ({ ...p, leanToJson: true }));
    setErrorLine(null);
    try {
      const start = getTime();
      const result = parse(leanInput, { strict: strictMode });
      const jsonString = JSON.stringify(result, null, 2);
      setJsonOutput(jsonString);
      setLeanMessage('');
      setJsonMessage('Converted successfully');
      setPerformance(prev => ({ ...prev, parseTime: getTime() - start }));
      addToHistory('leanToJson');
    } catch (error) {
      const info = parseErrorInfo(error);
      setJsonOutput('');
      setLeanMessage(info.message);
      setJsonMessage('');
      if (info.line) setErrorLine(info.line);
    } finally {
      setConverting(p => ({ ...p, leanToJson: false }));
    }
  }, [leanInput, strictMode, addToHistory]);

  const convertJsonToLean = useCallback(async () => {
    if (!jsonOutput.trim()) return;
    setConverting(p => ({ ...p, jsonToLean: true }));
    setErrorLine(null);
    try {
      const start = getTime();
      const obj = JSON.parse(jsonOutput);
      const result = format(obj, {
        indent: indent === 'tab' ? '\t' : Number(indent),
      });
      setLeanInput(result);
      setLeanMessage('Converted successfully');
      setJsonMessage('');
      setPerformance(prev => ({ ...prev, formatTime: getTime() - start }));
      addToHistory('jsonToLean');
    } catch (error) {
      setJsonMessage(error.message);
      setLeanMessage('');
    } finally {
      setConverting(p => ({ ...p, jsonToLean: false }));
    }
  }, [jsonOutput, indent, addToHistory]);

  useEffect(() => {
    if (realTime && leanInput.trim()) {
      const id = setTimeout(convertLeanToJson, 500);
      return () => clearTimeout(id);
    }
  }, [leanInput, realTime, convertLeanToJson]);

  // Keyboard shortcuts: Ctrl+Enter to convert, Ctrl+D to toggle dark mode
  useKeyboard([
    { key: 'Enter', ctrl: true, handler: convertLeanToJson },
    { key: 'd', ctrl: true, handler: () => setDarkMode(p => !p) },
  ]);

  // Also handle Enter in json textarea
  const handleJsonKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      convertJsonToLean();
    }
  }, [convertJsonToLean]);

  // Scroll textarea to error line
  useEffect(() => {
    if (errorLine && leanTextareaRef.current) {
      const lineHeight = 21;
      leanTextareaRef.current.scrollTop = (errorLine - 5) * lineHeight;
    }
  }, [errorLine]);

  const clearAll = () => {
    setLeanInput('');
    setJsonOutput('');
    setLeanMessage('');
    setJsonMessage('');
    setHistory([]);
    setPerformance({ parseTime: 0, formatTime: 0 });
    setErrorLine(null);
  };

  const loadExample = (name) => {
    setLeanInput(EXAMPLES[name]);
    setErrorLine(null);
    if (!realTime) setTimeout(convertLeanToJson, 0);
  };

  const handleFileImport = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'lean') {
        setLeanInput(e.target.result);
        setErrorLine(null);
      } else {
        setJsonOutput(e.target.result);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const exportFile = (content, filename) => {
    if (!content.trim()) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsYaml = () => {
    try {
      const obj = JSON.parse(jsonOutput);
      const lines = [];
      function toYaml(val, indent) {
        if (val === null || val === undefined) return 'null';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string') return /[:\[\]{}#,>&*!|]/.test(val) ? JSON.stringify(val) : val;
        if (Array.isArray(val)) {
          if (val.length === 0) return '[]';
          return '\n' + val.map(v => `${'  '.repeat(indent)}- ${toYaml(v, indent + 1)}`).join('\n');
        }
        if (typeof val === 'object') {
          return '\n' + Object.entries(val).map(([k, v]) => `${'  '.repeat(indent)}${k}: ${toYaml(v, indent + 1)}`).join('\n');
        }
        return String(val);
      }
      const yaml = toYaml(obj, 0).trim();
      exportFile(yaml, 'data.yaml');
    } catch (e) {
      setJsonMessage('Cannot export: parse JSON first');
    }
  };

  const exportAsToml = () => {
    try {
      const obj = JSON.parse(jsonOutput);
      const result = [];
      function tomlValue(v, prefix) {
        if (v === null || v === undefined) return;
        if (typeof v === 'string') result.push(`${prefix} = ${JSON.stringify(v)}`);
        else if (typeof v === 'number' || typeof v === 'boolean') result.push(`${prefix} = ${v}`);
        else if (Array.isArray(v)) {
          if (v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
            for (const item of v) {
              result.push(`\n[[${prefix}]]`);
              for (const [ik, iv] of Object.entries(item)) tomlValue(iv, `${prefix}.${ik}`);
            }
          } else {
            const arr = v.map(x => typeof x === 'string' ? JSON.stringify(x) : String(x)).join(', ');
            result.push(`${prefix} = [${arr}]`);
          }
        } else if (typeof v === 'object') {
          result.push(`\n[${prefix}]`);
          for (const [k, val] of Object.entries(v)) tomlValue(val, `${prefix}.${k}`);
        }
      }
      for (const [k, v] of Object.entries(obj)) tomlValue(v, k);
      exportFile(result.join('\n').trim(), 'data.toml');
    } catch (e) {
      setJsonMessage('Cannot export: parse JSON first');
    }
  };

  const shareUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setJsonMessage('URL copied to clipboard!');
    });
  };

  const toggleSchema = () => {
    if (!showSchema) {
      try {
        const obj = JSON.parse(jsonOutput);
        const schema = generateSchema(obj);
        setSchemaResult(JSON.stringify(schema, null, 2));
      } catch {
        setSchemaResult('// Parse LEAN to JSON first to generate schema');
      }
    }
    setShowSchema(p => !p);
  };

  const busy = converting.leanToJson || converting.jsonToLean;

  useEffect(() => {
    localStorage.setItem('lean-dark', String(darkMode));
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`playground-root${darkMode ? ' dark' : ''}`} role="application" aria-label="LEAN Format Playground">
      <div className="container">
        <header>
          <h1>
            <img src={logo} alt="LEAN Logo" height="50" style={{ marginRight: '15px' }} />
            LEAN Playground
          </h1>
          <p className="subtitle">Lightweight Efficient Adaptive Notation</p>
          <div className="header-controls">
            <button className="dark-mode-btn" onClick={() => setDarkMode(p => !p)} aria-label="Toggle dark mode" title="Ctrl+D">
              {darkMode ? '\u2600 Light' : '\u263E Dark'}
            </button>
          </div>
        </header>

        <div className="main-grid">
          <section className="panel" aria-label="LEAN input editor">
            <div className="panel-header">
              <span id="lean-input-label">LEAN Format</span>
              <div className="stats">
                <span className="stat">{stats.leanLines} lines</span>
                <span className="stat">{stats.leanChars} chars</span>
                <CompactnessIndicator stats={stats} />
              </div>
            </div>
            <div className="panel-content editor-container" ref={leanContainerRef}>
              <div className="editor-wrapper">
                <LineNumbers text={leanInput} errorLine={errorLine} />
                <textarea
                  ref={leanTextareaRef}
                  value={leanInput}
                  onChange={(e) => setLeanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      convertLeanToJson();
                    }
                  }}
                  placeholder="Enter LEAN here..."
                  spellCheck={false}
                  disabled={busy}
                  aria-labelledby="lean-input-label"
                  aria-describedby="lean-status"
                  className="code-textarea"
                />
              </div>
              {converting.leanToJson && <div className="converting-overlay" role="status">Parsing...</div>}
              {leanMessage && (
                <div id="lean-status" className={`alert ${leanMessage.includes('Converted') ? 'success' : 'error'}`}
                     onClick={() => setErrorLine(null)} role="alert"
                     tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setErrorLine(null)}>
                  {errorLine && <span className="error-line-badge">Line {errorLine}</span>}
                  {leanMessage}
                </div>
              )}
            </div>
          </section>

          <section className="panel" aria-label="JSON output">
            <div className="panel-header">
              <span id="json-output-label">JSON Output</span>
              <div className="stats">
                <span className="stat">{stats.jsonLines} lines</span>
                <span className="stat">{stats.jsonChars} chars</span>
              </div>
            </div>
            <div className="panel-content editor-container">
              <div className="editor-wrapper">
                <LineNumbers text={jsonOutput} />
                <textarea
                  ref={jsonTextareaRef}
                  value={jsonOutput}
                  onChange={(e) => setJsonOutput(e.target.value)}
                  onKeyDown={handleJsonKeyDown}
                  placeholder="JSON will appear here..."
                  spellCheck={false}
                  disabled={busy}
                  aria-labelledby="json-output-label"
                  aria-describedby="json-status"
                  className="code-textarea"
                />
              </div>
              {converting.jsonToLean && <div className="converting-overlay" role="status">Formatting...</div>}
              {jsonMessage && (
                <div id="json-status" className={`alert ${jsonMessage.includes('success') || jsonMessage.includes('copied') ? 'success' : 'error'}`}
                     role="alert">
                  {jsonMessage}
                </div>
              )}
            </div>
          </section>
        </div>

        {showSchema && schemaResult && (
          <section className="schema-panel" aria-label="Generated Schema">
            <div className="panel-header">
              <span>Generated JSON Schema</span>
              <button className="secondary small" onClick={() => setShowSchema(false)} aria-label="Close schema panel">\u2715 Close</button>
            </div>
            <div className="panel-content">
              <pre className="schema-output">{schemaResult}</pre>
            </div>
          </section>
        )}

        <div className="controls" role="toolbar" aria-label="Playground controls">
          <div className="conversion-buttons">
            <button onClick={convertLeanToJson} disabled={busy || !leanInput.trim()} aria-label="Convert LEAN to JSON" title="Ctrl+Enter">
              {converting.leanToJson ? 'Parsing...' : 'LEAN \u2192 JSON'}
            </button>
            <button onClick={convertJsonToLean} disabled={busy || !jsonOutput.trim()} aria-label="Convert JSON to LEAN" title="Ctrl+Enter">
              {converting.jsonToLean ? 'Formatting...' : 'JSON \u2192 LEAN'}
            </button>
            <button className="secondary" onClick={toggleSchema} aria-label="Toggle schema view">
              {showSchema ? 'Hide Schema' : 'Show Schema'}
            </button>
            <button className="secondary" onClick={clearAll} aria-label="Clear all content">Clear All</button>
            <button className="secondary" onClick={shareUrl} title="Copy shareable URL" aria-label="Copy shareable URL">Share</button>
          </div>

          <div className="file-actions">
            <label className="file-btn" aria-label="Import LEAN file">
              Import LEAN
              <input type="file" accept=".lean,.txt" onChange={(e) => handleFileImport(e, 'lean')} hidden disabled={busy} />
            </label>
            <label className="file-btn" aria-label="Import JSON file">
              Import JSON
              <input type="file" accept=".json,.txt" onChange={(e) => handleFileImport(e, 'json')} hidden disabled={busy} />
            </label>
            <button onClick={() => exportFile(leanInput, 'data.lean')} disabled={!leanInput.trim()} aria-label="Export LEAN file">Export LEAN</button>
            <button onClick={() => exportFile(jsonOutput, 'data.json')} disabled={!jsonOutput.trim()} aria-label="Export JSON file">Export JSON</button>
            <button onClick={exportAsYaml} disabled={!jsonOutput.trim()} aria-label="Export as YAML" title="Export current JSON as YAML">YAML</button>
            <button onClick={exportAsToml} disabled={!jsonOutput.trim()} aria-label="Export as TOML" title="Export current JSON as TOML">TOML</button>
          </div>

          <div className="options">
            <label>
              <input type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)} disabled={busy} aria-label="Enable strict mode" />
              Strict mode
            </label>
            <label>
              <input type="checkbox" checked={realTime} onChange={(e) => setRealTime(e.target.checked)} disabled={busy} aria-label="Enable real-time conversion" />
              Real-time
            </label>
            <label>
              Indent
              <select value={indent} onChange={(e) => setIndent(e.target.value)} disabled={busy} aria-label="Indentation size">
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            </label>
          </div>

          <div className="performance" aria-label="Performance metrics">
            <span className="stat">Parse: {performance.parseTime.toFixed(1)}ms</span>
            <span className="stat">Format: {performance.formatTime.toFixed(1)}ms</span>
          </div>
        </div>

        {history.length > 0 && (
          <section className="history" aria-label="Conversion history">
            <h3>Conversion History (Last 10)</h3>
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-direction">{item.direction === 'leanToJson' ? 'LEAN \u2192 JSON' : 'JSON \u2192 LEAN'}</div>
                  <div className="history-time">{item.timestamp.toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="examples" aria-label="Example datasets">
          <h3>Example Datasets</h3>
          <div className="example-buttons">
            {[
              ['simple', 'Simple Object'],
              ['users', 'User List'],
              ['products', 'Product Catalog'],
              ['blog', 'Blog Structure'],
              ['complex', 'Complex Nested'],
            ].map(([key, label]) => (
              <button key={key} className="example-btn" onClick={() => loadExample(key)} disabled={busy} aria-label={`Load ${label} example`}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <footer className="app-footer">
          <p>Shortcuts: <kbd>Ctrl+Enter</kbd> Convert &middot; <kbd>Ctrl+D</kbd> Toggle Dark Mode</p>
        </footer>
      </div>
    </div>
  );
}
