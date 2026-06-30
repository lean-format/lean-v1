export default function LanguageSpecPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">Language Specification</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Complete reference for the LEAN Format language.</p>

      <h2 className="text-2xl font-semibold mb-4">Syntax Overview</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        LEAN Format uses an indentation-based syntax similar to YAML but with formal block structure.
        Each file consists of top-level declarations: models, enums, relations, constraints, types, and docs.
      </p>

      <h3 className="text-xl font-semibold mb-3">Models</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`model ModelName {
  fieldName: Type
  optionalField?: Type
}`}</code></pre>

      <h3 className="text-xl font-semibold mb-3">Enums</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`enum EnumName {
  VALUE_1
  VALUE_2
  VALUE_3
}`}</code></pre>

      <h3 className="text-xl font-semibold mb-3">Relations</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`relation Source->Target {
  label: -> Target
  label?: -> Target
}`}</code></pre>

      <h3 className="text-xl font-semibold mb-3">Built-in Types</h3>
      <ul className="list-disc pl-6 space-y-2 mb-8 text-gray-600 dark:text-gray-300">
        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">String</code> &mdash; UTF-8 string</li>
        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Number</code> &mdash; IEEE 754 double</li>
        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Boolean</code> &mdash; true/false</li>
        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Date</code> &mdash; ISO 8601 date</li>
        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">ID</code> &mdash; Unique identifier</li>
        <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">JSON</code> &mdash; Arbitrary JSON value</li>
      </ul>
    </div>
  );
}
