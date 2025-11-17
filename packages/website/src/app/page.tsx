"use client"

import { useEffect } from 'react';

export default function Page() {
    useEffect(() => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href')!);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.feature, section').forEach(el => {
            observer.observe(el);
        });
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    };

    return (
        <>
            <style jsx global>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :root {
                    --primary: #667eea;
                    --primary-dark: #5568d3;
                    --secondary: #764ba2;
                    --accent: #f093fb;
                    --text: #2d3748;
                    --text-light: #718096;
                    --bg: #ffffff;
                    --bg-light: #f7fafc;
                    --border: #e2e8f0;
                    --code-bg: #1a202c;
                    --success: #48bb78;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: var(--text);
                    background: var(--bg);
                }

                /* Header */
                header {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    color: white;
                    padding: 1rem 0;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                nav {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .logo {
                    font-size: 1.5rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .nav-links {
                    display: flex;
                    gap: 2rem;
                    list-style: none;
                }

                .nav-links a {
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    transition: opacity 0.3s;
                }

                .nav-links a:hover {
                    opacity: 0.8;
                }

                /* Hero */
                .hero {
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    color: white;
                    padding: 6rem 2rem;
                    text-align: center;
                }

                .hero h1 {
                    font-size: 3.5rem;
                    margin-bottom: 1rem;
                    font-weight: 800;
                }

                .hero p {
                    font-size: 1.5rem;
                    opacity: 0.95;
                    max-width: 800px;
                    margin: 0 auto 2rem;
                }

                .cta-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn {
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s;
                    display: inline-block;
                }

                .btn-primary {
                    background: white;
                    color: var(--primary);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }

                .btn-secondary {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid white;
                }

                .btn-secondary:hover {
                    background: rgba(255,255,255,0.3);
                }

                /* Features */
                .features {
                    max-width: 1200px;
                    margin: 4rem auto;
                    padding: 0 2rem;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                }

                .feature {
                    background: var(--bg-light);
                    padding: 2rem;
                    border-radius: 12px;
                    border: 2px solid var(--border);
                    transition: all 0.3s;
                }

                .feature:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    border-color: var(--primary);
                }

                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .feature h3 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: var(--primary);
                }

                /* Content Sections */
                section {
                    max-width: 1200px;
                    margin: 4rem auto;
                    padding: 0 2rem;
                }

                section h2 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    color: var(--primary);
                }

                section h3 {
                    font-size: 1.8rem;
                    margin: 2rem 0 1rem;
                    color: var(--text);
                }

                /* Code Blocks */
                .code-example {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin: 2rem 0;
                }

                .code-block {
                    background: var(--code-bg);
                    color: #a0aec0;
                    padding: 1.5rem;
                    border-radius: 8px;
                    overflow-x: auto;
                    position: relative;
                }

                .code-label {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                pre {
                    margin: 0;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .keyword { color: #c792ea; }
                .string { color: #c3e88d; }
                .number { color: #f78c6c; }
                .comment { color: #546e7a; }
                .key { color: #82aaff; }

                /* Comparison Table */
                .comparison {
                    overflow-x: auto;
                    margin: 2rem 0;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                th, td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid var(--border);
                }

                th {
                    background: var(--primary);
                    color: white;
                    font-weight: 600;
                }

                tr:hover {
                    background: var(--bg-light);
                }

                .check { color: var(--success); font-weight: bold; }
                .cross { color: #f56565; font-weight: bold; }
                .partial { color: #ed8936; font-weight: bold; }

                /* Quick Start */
                .quick-start {
                    background: var(--bg-light);
                    padding: 3rem;
                    border-radius: 12px;
                    border-left: 4px solid var(--primary);
                }

                .install-command {
                    background: var(--code-bg);
                    color: #a0aec0;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    margin: 1rem 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .copy-btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 600;
                    transition: all 0.3s;
                }

                .copy-btn:hover {
                    background: var(--primary-dark);
                }

                /* Footer */
                footer {
                    background: var(--code-bg);
                    color: white;
                    padding: 3rem 2rem;
                    margin-top: 6rem;
                }

                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                }

                .footer-section h4 {
                    margin-bottom: 1rem;
                    color: var(--accent);
                }

                .footer-section a {
                    color: #a0aec0;
                    text-decoration: none;
                    display: block;
                    margin-bottom: 0.5rem;
                    transition: color 0.3s;
                }

                .footer-section a:hover {
                    color: white;
                }

                .footer-bottom {
                    text-align: center;
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid #4a5568;
                    color: #a0aec0;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .hero h1 { font-size: 2.5rem; }
                    .hero p { font-size: 1.2rem; }
                    .code-example { grid-template-columns: 1fr; }
                    .nav-links { display: none; }
                }

                /* Animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate {
                    animation: fadeInUp 0.6s ease-out;
                }
            `}</style>

            <header>
                <nav>
                    <div className="logo">
                        <span>🌟</span>
                        <span>LEAN</span>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#examples">Examples</a></li>
                        <li><a href="#install">Install</a></li>
                        <li><a href="#docs">Docs</a></li>
                        <li><a href="https://github.com/lean-format/lean-js">GitHub</a></li>
                    </ul>
                </nav>
            </header>

            <section className="hero">
                <h1 className="animate">LEAN Format</h1>
                <p className="animate">Lightweight Efficient Adaptive Notation</p>
                <p className="animate">A minimal, human-readable data format that combines JSON's flexibility with CSV's compactness</p>
                <div className="cta-buttons animate">
                    <a href="#install" className="btn btn-primary">Get Started</a>
                    <a href="#examples" className="btn btn-secondary">See Examples</a>
                </div>
            </section>

            <div className="features" id="features">
                <div className="feature">
                    <div className="feature-icon">⚡</div>
                    <h3>Compact</h3>
                    <p>Row syntax eliminates key repetition in lists, making your data up to 70% smaller than JSON for tabular content.</p>
                </div>
                <div className="feature">
                    <div className="feature-icon">👁️</div>
                    <h3>Readable</h3>
                    <p>Natural indentation and minimal syntax make LEAN easy to read and write by humans.</p>
                </div>
                <div className="feature">
                    <div className="feature-icon">🔄</div>
                    <h3>Flexible</h3>
                    <p>Seamlessly mix objects, lists, and row syntax. Use the best representation for each data type.</p>
                </div>
                <div className="feature">
                    <div className="feature-icon">🎯</div>
                    <h3>Simple</h3>
                    <p>Learn the entire format in 5 minutes. No complex rules or edge cases to remember.</p>
                </div>
            </div>

            <section id="examples">
                <h2>See the Difference</h2>
                <p>Compare how LEAN represents the same data versus JSON:</p>

                <div className="code-example">
                    <div className="code-block">
                        <div className="code-label">LEAN</div>
                        <pre>
              <span className="comment"># Compact and readable</span>{'\n'}
                            <span className="key">users</span>(<span className="key">id</span>, <span className="key">name</span>, <span className="key">email</span>, <span className="key">age</span>):{'\n'}
                            {'    '}- <span className="number">1</span>, <span className="string">Alice</span>, <span className="string">alice@example.com</span>, <span className="number">30</span>{'\n'}
                            {'    '}- <span className="number">2</span>, <span className="string">Bob</span>, <span className="string">bob@example.com</span>, <span className="number">25</span>{'\n'}
                            {'    '}- <span className="number">3</span>, <span className="string">Casey</span>, <span className="string">casey@example.com</span>, <span className="number">28</span>
            </pre>
                    </div>
                    <div className="code-block">
                        <div className="code-label">JSON</div>
                        <pre>
              {`{
  `}<span className="key">"users"</span>: [{`
    {
      `}<span className="key">"id"</span>: <span className="number">1</span>,{`
      `}<span className="key">"name"</span>: <span className="string">"Alice"</span>,{`
      `}<span className="key">"email"</span>: <span className="string">"alice@example.com"</span>,{`
      `}<span className="key">"age"</span>: <span className="number">30</span>{`
    },
    {
      `}<span className="key">"id"</span>: <span className="number">2</span>,{`
      `}<span className="key">"name"</span>: <span className="string">"Bob"</span>,{`
      `}<span className="key">"email"</span>: <span className="string">"bob@example.com"</span>,{`
      `}<span className="key">"age"</span>: <span className="number">25</span>{`
    },
    {
      `}<span className="key">"id"</span>: <span className="number">3</span>,{`
      `}<span className="key">"name"</span>: <span className="string">"Casey"</span>,{`
      `}<span className="key">"email"</span>: <span className="string">"casey@example.com"</span>,{`
      `}<span className="key">"age"</span>: <span className="number">28</span>{`
    }
  ]
}`}
            </pre>
                    </div>
                </div>

                <h3>Complex Nested Structures</h3>
                <p>LEAN handles nested objects beautifully:</p>

                <div className="code-block">
                    <div className="code-label">LEAN</div>
                    <pre>
            <span className="key">blog</span>:{'\n'}
                        {'    '}<span className="key">title</span>: <span className="string">"Tech Insights"</span>{'\n'}
                        {'    '}<span className="key">author</span>: <span className="string">Alice</span>{'\n'}
                        {'    '}<span className="key">tags</span>:{'\n'}
                        {'        '}- <span className="string">technology</span>{'\n'}
                        {'        '}- <span className="string">programming</span>{'\n'}
                        {'        '}- <span className="string">ai</span>{'\n'}
                        {'    '}<span className="key">posts</span>(<span className="key">id</span>, <span className="key">title</span>, <span className="key">date</span>, <span className="key">views</span>):{'\n'}
                        {'        '}- <span className="number">1</span>, <span className="string">"Getting Started"</span>, <span className="string">"2025-01-15"</span>, <span className="number">1250</span>{'\n'}
                        {'        '}- <span className="number">2</span>, <span className="string">"Advanced Topics"</span>, <span className="string">"2025-02-01"</span>, <span className="number">890</span>{'\n'}
                        {'    '}<span className="key">config</span>:{'\n'}
                        {'        '}<span className="key">theme</span>: <span className="string">dark</span>{'\n'}
                        {'        '}<span className="key">comments</span>: <span className="keyword">true</span>
          </pre>
                </div>
            </section>

            <section>
                <h2>Format Comparison</h2>
                <div className="comparison">
                    <table>
                        <thead>
                        <tr>
                            <th>Feature</th>
                            <th>JSON</th>
                            <th>YAML</th>
                            <th>CSV</th>
                            <th>LEAN</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Human-readable</td>
                            <td><span className="partial">⚠️ Verbose</span></td>
                            <td><span className="check">✓</span></td>
                            <td><span className="partial">⚠️ Limited</span></td>
                            <td><span className="check">✓</span></td>
                        </tr>
                        <tr>
                            <td>Compact rows</td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="check">✓</span></td>
                            <td><span className="check">✓</span></td>
                        </tr>
                        <tr>
                            <td>Nested objects</td>
                            <td><span className="check">✓</span></td>
                            <td><span className="check">✓</span></td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="check">✓</span></td>
                        </tr>
                        <tr>
                            <td>No key repetition</td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="check">✓</span></td>
                            <td><span className="check">✓</span></td>
                        </tr>
                        <tr>
                            <td>Comments</td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="check">✓</span></td>
                            <td><span className="cross">✗</span></td>
                            <td><span className="check">✓</span></td>
                        </tr>
                        <tr>
                            <td>Easy to parse</td>
                            <td><span className="check">✓</span></td>
                            <td><span className="partial">⚠️ Complex</span></td>
                            <td><span className="check">✓</span></td>
                            <td><span className="check">✓</span></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section id="install">
                <h2>Quick Start</h2>
                <div className="quick-start">
                    <h3>Installation</h3>
                    <div className="install-command">
                        <span>npm install lean-format</span>
                        <button className="copy-btn" onClick={() => copyToClipboard('npm install lean-format')}>Copy</button>
                    </div>

                    <h3>Node.js Usage</h3>
                    <div className="code-block">
            <pre>
              <span className="keyword">const</span> {`{ parse, format } = `}<span className="keyword">require</span>(<span className="string">'lean-format'</span>);{'\n\n'}
                <span className="comment">// Parse LEAN to JavaScript</span>{'\n'}
                <span className="keyword">const</span> {` data = parse(`}<span className="string">{`\`
users(id, name, age):
    - 1, Alice, 30
    - 2, Bob, 25
\``}</span>{`);

`}<span className="comment">// Format JavaScript as LEAN</span>{'\n'}
                <span className="keyword">const</span> {` lean = format(data);
console.log(lean);`}
            </pre>
                    </div>

                    <h3>Browser Usage</h3>
                    <div className="code-block">
            <pre>
              <span className="keyword">&lt;script</span> src=<span className="string">"https://unpkg.com/lean-format"</span><span className="keyword">&gt;&lt;/script&gt;</span>{'\n'}
                <span className="keyword">&lt;script&gt;</span>{'\n'}
                {'  '}<span className="keyword">const</span> {`{ parse, format } = LEAN;
  `}<span className="keyword">const</span> data = parse(<span className="string">'key: value'</span>);{'\n'}
                <span className="keyword">&lt;/script&gt;</span>
            </pre>
                    </div>

                    <h3>Command Line</h3>
                    <div className="code-block">
            <pre>
              <span className="comment"># Parse LEAN to JSON</span>{'\n'}
                {`lean parse data.lean

`}<span className="comment"># Format JSON as LEAN</span>{'\n'}
                {`lean format data.json

`}<span className="comment"># Watch and auto-convert</span>{'\n'}
                lean watch data.lean
            </pre>
                    </div>
                </div>
            </section>

            <section id="docs">
                <h2>Documentation</h2>
                <div className="features">
                    <div className="feature">
                        <h3>📖 Specification</h3>
                        <p>Complete format specification with grammar and rules.</p>
                        <a href="#" className="btn btn-primary" style={{ marginTop: '1rem' }}>Read Spec</a>
                    </div>
                    <div className="feature">
                        <h3>💻 API Reference</h3>
                        <p>Full API documentation for all functions and options.</p>
                        <a href="#" className="btn btn-primary" style={{ marginTop: '1rem' }}>View API</a>
                    </div>
                    <div className="feature">
                        <h3>🎮 Playground</h3>
                        <p>Try LEAN format interactively in your browser.</p>
                        <a href="#" className="btn btn-primary" style={{ marginTop: '1rem' }}>Open Playground</a>
                    </div>
                </div>
            </section>

            <footer>
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Resources</h4>
                        <a href="#">Documentation</a>
                        <a href="#">Specification</a>
                        <a href="#">API Reference</a>
                        <a href="#">Playground</a>
                    </div>
                    <div className="footer-section">
                        <h4>Tools</h4>
                        <a href="#">NPM Package</a>
                        <a href="#">CLI Tool</a>
                        <a href="#">VS Code Extension</a>
                        <a href="#">Online Converter</a>
                    </div>
                    <div className="footer-section">
                        <h4>Community</h4>
                        <a href="https://github.com/lean-format/lean-js">GitHub</a>
                        <a href="#">Discord</a>
                        <a href="#">Twitter</a>
                        <a href="#">Stack Overflow</a>
                    </div>
                    <div className="footer-section">
                        <h4>More</h4>
                        <a href="#">Blog</a>
                        <a href="#">Examples</a>
                        <a href="#">Contributing</a>
                        <a href="#">License (MIT)</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2025 LEAN Format. Released under the MIT License.</p>
                    <p>Made with ❤️ by the LEAN Format Team</p>
                </div>
            </footer>
        </>
    );
}