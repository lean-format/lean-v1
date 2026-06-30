export default function BestPracticesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">Best Practices</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Guidelines for writing clean, maintainable LEAN Format schemas.</p>

      <h2 className="text-2xl font-semibold mb-4">Naming Conventions</h2>
      <ul className="list-disc pl-6 space-y-2 mb-8 text-gray-600 dark:text-gray-300">
        <li>Use <strong>PascalCase</strong> for model and enum names</li>
        <li>Use <strong>camelCase</strong> for field names</li>
        <li>Use <strong>UPPER_CASE</strong> for enum values</li>
        <li>Choose descriptive, singular names for models</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Schema Organization</h2>
      <ul className="list-disc pl-6 space-y-2 mb-8 text-gray-600 dark:text-gray-300">
        <li>Group related models together in the same file</li>
        <li>Define enums before the models that reference them</li>
        <li>Keep schemas under 200 lines; split large schemas into separate files</li>
        <li>Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">doc</code> blocks to document complex models and fields</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Type Safety</h2>
      <ul className="list-disc pl-6 space-y-2 mb-8 text-gray-600 dark:text-gray-300">
        <li>Always specify explicit types for each field</li>
        <li>Use custom types to enforce domain constraints</li>
        <li>Prefer enums over strings for fixed value sets</li>
        <li>Add constraints for additional validation</li>
      </ul>
    </div>
  );
}
