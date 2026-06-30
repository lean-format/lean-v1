export default function APICorePage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">@lean-format/core API</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Core parser, validator, and formatter API.</p>

      <h2 className="text-2xl font-semibold mb-4">parse(source: string): ParseResult</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Parses a LEAN Format source string and returns an AST (Abstract Syntax Tree).
      </p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`const result = parse(\`
model User {
  name: String
}
\`);
console.log(result.ast);`}</code></pre>

      <h2 className="text-2xl font-semibold mb-4">validate(source: string): ValidationResult[]</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Validates a LEAN Format source and returns an array of errors, warnings, and info messages.
      </p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`const errors = validate(source);`}</code></pre>

      <h2 className="text-2xl font-semibold mb-4">format(source: string): string</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Pretty-prints a LEAN Format source string with consistent formatting.
      </p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`const formatted = format(source);`}</code></pre>
    </div>
  );
}
