"use client"

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function Page() {
    const [copiedText, setCopiedText] = useState('');

    useEffect(() => {
        // Smooth scrolling for anchor links
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLAnchorElement;
            if (target.matches('a[href^="#"]')) {
                e.preventDefault();
                const href = target.getAttribute('href');
                const targetElement = document.querySelector(href!);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        document.addEventListener('click', handleAnchorClick);

        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        const elementsToObserve = document.querySelectorAll('.feature, .code-block, .comparison, .quick-start');
        elementsToObserve.forEach(el => observer.observe(el));

        return () => {
            document.removeEventListener('click', handleAnchorClick);
            observer.disconnect();
        };
    }, []);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            setTimeout(() => setCopiedText(''), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedText(text);
            setTimeout(() => setCopiedText(''), 2000);
        }
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Toast Notification */}
            {copiedText && (
                <div className="toast">
                    ✅ Copied to clipboard!
                </div>
            )}

            {/* Scroll to Top Button */}
            <button
                className="scroll-to-top"
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                ↑
            </button>

            <header>
                <nav>
                    <div className="logo">
                        <span>
                            <svg width="30" height="20" viewBox="0 0 30 30">
                                <rect x="0" y="6" width="37" height="3" fill="white" rx="2" />
                                <rect x="0" y="16" width="28" height="3" fill="white" rx="2" opacity="0.8" />
                                <rect x="0" y="26" width="16" height="3" fill="white" rx="2" opacity="0.6" />
                            </svg>
                        </span>
                        <span>LEAN</span>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#examples">Examples</a></li>
                        <li><a href="#install">Install</a></li>
                        <li><a href="#docs">Docs</a></li>
                        <li><a href="https://github.com/lean-format/lean-v1" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                    </ul>
                    <div className="nav-actions">
                        <Link href="/playground" className="btn btn-outline">Try Playground</Link>
                    </div>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1 className="animate">LEAN Format</h1>
                    <p className="hero-subtitle animate">Lightweight Efficient Adaptive Notation</p>
                    <p className="hero-description animate">
                        A minimal, human-readable data format that combines JSON's flexibility with CSV's compactness
                    </p>
                    <div className="hero-stats animate">
                        <div className="stat">
                            <span className="stat-number">70%</span>
                            <span className="stat-label">Smaller than JSON</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">5min</span>
                            <span className="stat-label">To learn</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">100%</span>
                            <span className="stat-label">Compatible</span>
                        </div>
                    </div>
                    <div className="cta-buttons animate">
                        <a href="#install" className="btn btn-primary">Get Started</a>
                        <a href="#examples" className="btn btn-secondary">See Examples</a>
                        <Link href="/playground" className="btn btn-outline">Try Playground</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="code-preview">
                        <div className="code-preview-header">
                            <div className="code-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                        <pre className="lean-preview">
                            <code>
                                <span className="comment"># Clean, readable syntax</span>
                                {'\n'}
                                <span className="key">users</span>(<span className="key">id</span>, <span className="key">name</span>, <span className="key">email</span>):
                                {'\n'}
                                {'  '}- <span className="number">1</span>, <span className="string">"Alice"</span>, <span className="string">"alice@example.com"</span>
                                {'\n'}
                                {'  '}- <span className="number">2</span>, <span className="string">"Bob"</span>, <span className="string">"bob@example.com"</span>
                                {'\n'}
                                {'\n'}
                                <span className="key">config</span>:
                                {'\n'}
                                {'  '}<span className="key">theme</span>: <span className="string">"dark"</span>
                                {'\n'}
                                {'  '}<span className="key">features</span>:
                                {'\n'}
                                {'    '}- <span className="string">"auth"</span>
                                {'\n'}
                                {'    '}- <span className="string">"api"</span>
                            </code>
                        </pre>
                    </div>
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
                <p className="section-subtitle">Compare how LEAN represents the same data versus JSON:</p>

                <div className="code-example">
                    <div className="code-block">
                        <div className="code-label">LEAN - 126 chars</div>
                        <pre>
                            <code>
                                <span className="comment"># Compact and readable</span>{'\n'}
                                <span className="key">users</span>(<span className="key">id</span>, <span className="key">name</span>, <span className="key">email</span>, <span className="key">age</span>):{'\n'}
                                {'    '}- <span className="number">1</span>, <span className="string">"Alice"</span>, <span className="string">"alice@example.com"</span>, <span className="number">30</span>{'\n'}
                                {'    '}- <span className="number">2</span>, <span className="string">"Bob"</span>, <span className="string">"bob@example.com"</span>, <span className="number">25</span>{'\n'}
                                {'    '}- <span className="number">3</span>, <span className="string">"Casey"</span>, <span className="string">"casey@example.com"</span>, <span className="number">28</span>
                            </code>
                        </pre>
                    </div>
                    <div className="code-block">
                        <div className="code-label">JSON - 284 chars</div>
                        <pre>
                            <code>
                                {`{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "age": 30
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "age": 25
    },
    {
      "id": 3,
      "name": "Casey",
      "email": "casey@example.com",
      "age": 28
    }
  ]
}`}
                            </code>
                        </pre>
                    </div>
                </div>

                <div className="efficiency-badge">
                    <span className="efficiency-icon">🎯</span>
                    <span className="efficiency-text">55% more efficient</span>
                </div>

                <h3>Complex Nested Structures</h3>
                <p>LEAN handles nested objects beautifully:</p>

                <div className="code-block">
                    <div className="code-label">LEAN</div>
                    <pre>
                        <code>
                            <span className="key">blog</span>:{'\n'}
                            {'    '}<span className="key">title</span>: <span className="string">"Tech Insights"</span>{'\n'}
                            {'    '}<span className="key">author</span>: <span className="string">"Alice"</span>{'\n'}
                            {'    '}<span className="key">tags</span>:{'\n'}
                            {'        '}- <span className="string">"technology"</span>{'\n'}
                            {'        '}- <span className="string">"programming"</span>{'\n'}
                            {'        '}- <span className="string">"ai"</span>{'\n'}
                            {'    '}<span className="key">posts</span>(<span className="key">id</span>, <span className="key">title</span>, <span className="key">date</span>, <span className="key">views</span>):{'\n'}
                            {'        '}- <span className="number">1</span>, <span className="string">"Getting Started"</span>, <span className="string">"2025-01-15"</span>, <span className="number">1250</span>{'\n'}
                            {'        '}- <span className="number">2</span>, <span className="string">"Advanced Topics"</span>, <span className="string">"2025-02-01"</span>, <span className="number">890</span>{'\n'}
                            {'    '}<span className="key">config</span>:{'\n'}
                            {'        '}<span className="key">theme</span>: <span className="string">"dark"</span>{'\n'}
                            {'        '}<span className="key">comments</span>: <span className="keyword">true</span>
                        </code>
                    </pre>
                </div>
            </section>

            <section className="comparison-section">
                <h2>Format Comparison</h2>
                <p className="section-subtitle">See how LEAN compares to other popular formats</p>

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
                                <td><span className="check">✓ Excellent</span></td>
                                <td><span className="partial">⚠️ Limited</span></td>
                                <td><span className="check">✓ Excellent</span></td>
                            </tr>
                            <tr>
                                <td>Compact rows</td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="check">✓ Yes</span></td>
                                <td><span className="check">✓ Yes</span></td>
                            </tr>
                            <tr>
                                <td>Nested objects</td>
                                <td><span className="check">✓ Yes</span></td>
                                <td><span className="check">✓ Yes</span></td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="check">✓ Yes</span></td>
                            </tr>
                            <tr>
                                <td>No key repetition</td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="check">✓ Yes</span></td>
                                <td><span className="check">✓ Yes</span></td>
                            </tr>
                            <tr>
                                <td>Comments</td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="check">✓ Yes</span></td>
                                <td><span className="cross">✗ No</span></td>
                                <td><span className="check">✓ Yes</span></td>
                            </tr>
                            <tr>
                                <td>Easy to parse</td>
                                <td><span className="check">✓ Easy</span></td>
                                <td><span className="partial">⚠️ Complex</span></td>
                                <td><span className="check">✓ Easy</span></td>
                                <td><span className="check">✓ Easy</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section id="install">
                <h2>Quick Start</h2>
                <p className="section-subtitle">Get started with LEAN in minutes</p>

                <div className="quick-start">
                    <div className="install-step">
                        <h3>1. Installation</h3>
                        <div className="install-command">
                            <code>npm install lean-format</code>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard('npm install lean-format')}
                                aria-label="Copy install command"
                            >
                                {copiedText === 'npm install lean-format' ? '✅' : '📋'}
                            </button>
                        </div>
                    </div>

                    <div className="install-step">
                        <h3>2. Node.js Usage</h3>
                        <div className="code-block">
                            <pre>
                                <code>
                                    <span className="keyword">const</span> {`{ parse, format } = `}<span className="keyword">require</span>(<span className="string">'lean-format'</span>);{'\n\n'}
                                    <span className="comment">// Parse LEAN to JavaScript</span>{'\n'}
                                    <span className="keyword">const</span> {` data = parse(`}<span className="string">{`\`
users(id, name, age):
    - 1, Alice, 30
    - 2, Bob, 25
\``}</span>{`);`}{'\n\n'}
                                    <span className="comment">// Format JavaScript as LEAN</span>{'\n'}
                                    <span className="keyword">const</span> {` lean = format(data);
console.log(lean);`}
                                </code>
                            </pre>
                        </div>
                    </div>

                    <div className="install-step">
                        <h3>3. Try It Live</h3>
                        <p>Experiment with LEAN in our interactive playground:</p>
                        <Link href="/playground" className="btn btn-primary">
                            🎮 Open Playground
                        </Link>
                    </div>
                </div>
            </section>

            <section id="docs">
                <h2>Documentation</h2>
                <p className="section-subtitle">Everything you need to master LEAN</p>

                <div className="doc-cards">
                    <div className="doc-card">
                        <div className="doc-icon">📖</div>
                        <h3>Specification</h3>
                        <p>Complete format specification with grammar and rules, including syntax, data types, and best practices.</p>
                        <a
                            href="https://github.com/lean-format/lean-v1/blob/restruct/SPECIFICATION.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                        >
                            Read Spec
                        </a>
                    </div>
                    <div className="doc-card">
                        <div className="doc-icon">💻</div>
                        <h3>API Reference</h3>
                        <p>Documentation for parse(), format(), and validate() functions with all available options.</p>
                        <a
                            href="https://github.com/lean-format/lean-v1/blob/restruct/docs/API_INTEGRATION.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                        >
                            View API
                        </a>
                    </div>
                    <div className="doc-card">
                        <div className="doc-icon">🎮</div>
                        <h3>Playground</h3>
                        <p>Try LEAN format interactively in your browser with real-time conversion and examples.</p>
                        <Link href="/playground" className="btn btn-primary">
                            Open Playground
                        </Link>
                    </div>
                </div>
            </section>

            <footer>
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <svg width="30" height="20" viewBox="0 0 30 30">
                                <rect x="0" y="6" width="37" height="3" fill="white" rx="2" />
                                <rect x="0" y="16" width="28" height="3" fill="white" rx="2" opacity="0.8" />
                                <rect x="0" y="26" width="16" height="3" fill="white" rx="2" opacity="0.6" />
                            </svg>
                            <span>LEAN Format</span>
                        </div>
                        <p>Lightweight Efficient Adaptive Notation for modern data serialization.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-section">
                            <h4>Resources</h4>
                            <a href="#docs">Documentation</a>
                            <a href="#examples">Examples</a>
                            <a href="#install">Quick Start</a>
                            <Link href="/playground">Playground</Link>
                        </div>
                        <div className="footer-section">
                            <h4>Tools</h4>
                            <a href="https://www.npmjs.com/package/@lean-format/core" target="_blank" rel="noopener noreferrer">NPM Package</a>
                            <a href="https://www.npmjs.com/package/@lean-format/cli" target="_blank" rel="noopener noreferrer">CLI Tool</a>
                            <a href="https://marketplace.visualstudio.com/items?itemName=lean-format.lean-format" target="_blank" rel="noopener noreferrer">VS Code Extension</a>
                            <Link href="/playground">Online Converter</Link>
                        </div>
                        <div className="footer-section">
                            <h4>Community</h4>
                            <a href="https://github.com/lean-format/lean-v1" target="_blank" rel="noopener noreferrer">GitHub</a>
                            <a href="https://github.com/lean-format/lean-v1/discussions" target="_blank" rel="noopener noreferrer">Discussions</a>
                            <a href="https://twitter.com/leanformat" target="_blank" rel="noopener noreferrer">Twitter</a>
                            <a href="https://stackoverflow.com/questions/tagged/lean-format" target="_blank" rel="noopener noreferrer">Stack Overflow</a>
                        </div>
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