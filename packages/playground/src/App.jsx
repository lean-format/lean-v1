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
    active: true`,
  products: `store:
    name: TechShop
    products(id, name, price):
        - 1, "Wireless Mouse", 29.99
        - 2, "USB-C Hub", 49.99
        - 3, "Laptop Stand", 39.99`,
  blog: `blog:
    title: "Tech Insights"
    tags:
        - technology
        - programming
        - ai
    posts(id, title, date):
        - 1, "Getting Started", "2025-01-15"
        - 2, "Advanced Topics", "2025-02-01"`,
  complex: `company:
    name: "Acme Corp"
    departments(id, name):
        - 1, Engineering
        - 2, Marketing
    employees(id, name, dept):
        - 101, Alice, 1
        - 102, Bob, 1
        - 201, Casey, 2`
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
    return {
      leanLines,
      leanChars: leanInput.length,
      jsonLines,
      jsonChars: jsonOutput.length
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
          <h1>🌟 LEAN Playground</h1>
          <p className="subtitle">Lightweight Efficient Adaptive Notation</p>
        </header>

        <div className="main-grid">
          <section className="panel">
            <div className="panel-header">
              <span>LEAN Input</span>
              <div className="stats">
                <span className="stat">{stats.leanLines} lines</span>
                <span className="stat">{stats.leanChars} chars</span>
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
          <h3>📚 Example datasets</h3>
          <div className="example-buttons">
            {Object.keys(EXAMPLES).map((name) => (
              <button
                key={name}
                className="example-btn"
                onClick={() => {
                  loadExample(name);
                  setTimeout(convertLeanToJson, 0);
                }}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

