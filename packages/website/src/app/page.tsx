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
            <header>
                <nav>
                    <div className="logo">
                        <span>
                            <svg width="30" height="20" viewBox="0 0 30 30">
                        <rect x="0" y="6" width="37" height="3" fill="white" rx="2"/>
                        <rect x="0" y="16" width="28" height="3" fill="white" rx="2" opacity="0.8"/>
                        <rect x="0" y="26" width="16" height="3" fill="white" rx="2" opacity="0.6"/>
                    </svg>
                        </span>
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