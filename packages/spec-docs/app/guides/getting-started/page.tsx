export default function GettingStartedPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">Getting Started</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">This guide will walk you through creating your first LEAN Format schema.</p>

      <h2 className="text-2xl font-semibold mb-4">Installation</h2>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`npm install @lean-format/core
# or
pnpm add @lean-format/core`}</code></pre>

      <h2 className="text-2xl font-semibold mb-4">Basic Usage</h2>

      <h3 className="text-xl font-semibold mb-3">1. Define Your Schema</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Create a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.lean</code> file:</p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`model Person {
  id: ID
  firstName: String
  lastName: String
  age: Number
  email: String
}`}</code></pre>

      <h3 className="text-xl font-semibold mb-3">2. Parse the Schema</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`import { parse, validate, format } from '@lean-format/core';

const source = \`
model Person {
  id: ID
  name: String
  age: Number
}
\`;

const result = parse(source);
console.log(result.ast);

const errors = validate(source);
console.log(errors);

const formatted = format(source);
console.log(formatted);`}</code></pre>

      <h3 className="text-xl font-semibold mb-3">3. Use the CodeMirror Extension</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`import { EditorView, basicSetup } from 'codemirror';
import { leanFormatExtension } from '@lean-format/editor';

new EditorView({
  doc: source,
  extensions: [basicSetup, leanFormatExtension()],
  parent: document.getElementById('editor'),
});`}</code></pre>

      <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
        <li>Explore the <a href="/spec/language" className="text-[#6366f1] hover:underline">Language Specification</a></li>
        <li>Read the <a href="/guides/best-practices" className="text-[#6366f1] hover:underline">Best Practices</a> guide</li>
        <li>Check the <a href="/api/core" className="text-[#6366f1] hover:underline">API Reference</a></li>
      </ul>
    </div>
  );
}
