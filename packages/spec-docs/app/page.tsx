export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">LEAN Format</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        <strong>Lightweight Efficient Adaptive Notation</strong> &mdash; a minimal, human-readable data interchange format.
      </p>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        LEAN Format is designed as a modern alternative to JSON, YAML, and XML for schema definition and data interchange. It combines the readability of YAML with the formality of JSON Schema.
      </p>
      <h2 className="text-2xl font-semibold mb-4">Overview</h2>
      <ul className="list-disc pl-6 space-y-2 mb-8 text-gray-600 dark:text-gray-300">
        <li><strong>Human-readable</strong> &mdash; Minimal syntax with clean indentation</li>
        <li><strong>Schema-first</strong> &mdash; Define models, enums, relations, and constraints</li>
        <li><strong>Type-safe</strong> &mdash; Built-in type system with references</li>
        <li><strong>Portable</strong> &mdash; Compiles to JSON, YAML, or custom formats</li>
        <li><strong>Extensible</strong> &mdash; Plugin architecture for custom types and validators</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">Quick Example</h2>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`model User {
  id: ID
  name: String
  email: String
  age: Number
  role: Role
}

enum Role {
  Admin
  Editor
  Viewer
}

relation User->Post {
  author: -> Post
}`}</code></pre>
      <h2 className="text-2xl font-semibold mb-4">Core Concepts</h2>
      <ul className="list-disc pl-6 space-y-2 mb-8 text-gray-600 dark:text-gray-300">
        <li><strong>Models</strong> define data shapes with typed fields</li>
        <li><strong>Enums</strong> define fixed sets of values</li>
        <li><strong>Relations</strong> describe connections between models</li>
        <li><strong>Constraints</strong> enforce validation rules</li>
        <li><strong>Types</strong> can be built-in or custom references</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
      <p className="text-gray-600 dark:text-gray-300">Check out the <a href="/guides/getting-started" className="text-[#6366f1] hover:underline">Getting Started guide</a> to begin using LEAN Format.</p>
    </div>
  );
}
