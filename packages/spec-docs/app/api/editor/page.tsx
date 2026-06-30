export default function APIEditorPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">@lean-format/editor API</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">CodeMirror 6 extension for LEAN Format.</p>

      <h2 className="text-2xl font-semibold mb-4">leanFormat(): LanguageSupport</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Creates a CodeMirror 6 LanguageSupport extension for LEAN Format with syntax highlighting, indentation, and folding.
      </p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-8 text-sm"><code>{`import { EditorView, basicSetup } from 'codemirror';
import { leanFormatExtension } from '@lean-format/editor';

const view = new EditorView({
  doc: source,
  extensions: [basicSetup, leanFormatExtension()],
  parent: document.getElementById('editor'),
});`}</code></pre>

      <h2 className="text-2xl font-semibold mb-4">leanFormatExtension(): Extension[]</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Convenience function that bundles the language, autocomplete, and lint gutter into a single array of extensions.
      </p>
    </div>
  );
}
