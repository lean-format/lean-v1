const features = [
  {
    icon: '⚡',
    title: 'Compact',
    description: 'Row syntax removes duplicate keys and keeps payloads lean.'
  },
  {
    icon: '👁️',
    title: 'Readable',
    description: 'Indentation-based blocks are easy on the eyes and easy to edit.'
  },
  {
    icon: '🔄',
    title: 'Flexible',
    description: 'Mix nested objects, lists, and tabular data without switching formats.'
  },
  {
    icon: '🛠️',
    title: 'Tooling Ready',
    description: 'Parsers, CLIs, IDE extensions, and web playgrounds ship in this repo.'
  }
];

const comparison = [
  { feature: 'Human-readable', json: '⚠️', yaml: '✅', csv: '⚠️', lean: '✅' },
  { feature: 'Compact rows', json: '✗', yaml: '✗', csv: '✅', lean: '✅' },
  { feature: 'Nested data', json: '✅', yaml: '✅', csv: '✗', lean: '✅' },
  { feature: 'Comments', json: '✗', yaml: '✅', csv: '✗', lean: '✅' },
  { feature: 'No key repetition', json: '✗', yaml: '✗', csv: '✅', lean: '✅' }
];

const leanSnippet = `users(id, name, email, age):
    - 1, Alice, alice@example.com, 30
    - 2, Bob, bob@example.com, 25
    - 3, Casey, casey@example.com, 28`;

const jsonSnippet = `{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com", "age": 30 },
    { "id": 2, "name": "Bob", "email": "bob@example.com", "age": 25 },
    { "id": 3, "name": "Casey", "email": "casey@example.com", "age": 28 }
  ]
}`;

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 text-center">
          <p className="text-lg font-semibold tracking-widest">LEAN</p>
          <h1 className="text-4xl font-black leading-tight md:text-5xl">
            Lightweight Efficient Adaptive Notation
          </h1>
          <p className="mx-auto max-w-3xl text-lg opacity-90">
            A human-friendly data format with tabular superpowers. Stop repeating keys, keep the
            structure you love, and ship data that people can actually read.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              className="rounded-full bg-white px-6 py-3 font-semibold text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              href="https://www.npmjs.com/package/lean-format"
            >
              Install the parser
            </a>
            <a
              className="rounded-full border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              href="https://github.com/lean-format"
            >
              Explore the spec
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="mt-3 text-xl font-semibold text-primary">{feature.title}</h3>
              <p className="mt-2 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </section>

        <section>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl bg-slate-900 p-5 text-lime-100 shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-lime-300">LEAN</p>
              <pre className="mt-4 whitespace-pre-wrap text-sm">{leanSnippet}</pre>
            </article>
            <article className="rounded-2xl bg-slate-900 p-5 text-rose-100 shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-rose-300">JSON</p>
              <pre className="mt-4 whitespace-pre-wrap text-sm">{jsonSnippet}</pre>
            </article>
          </div>
        </section>

        <section>
          <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-6 py-3">Feature</th>
                  <th className="px-6 py-3">JSON</th>
                  <th className="px-6 py-3">YAML</th>
                  <th className="px-6 py-3">CSV</th>
                  <th className="px-6 py-3">LEAN</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-100">
                    <td className="px-6 py-3 font-medium">{row.feature}</td>
                    <td className="px-6 py-3">{row.json}</td>
                    <td className="px-6 py-3">{row.yaml}</td>
                    <td className="px-6 py-3">{row.csv}</td>
                    <td className="px-6 py-3">{row.lean}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">CLI</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Quick start</h2>
              <p className="mt-2 text-slate-500">
                Install the CLI, parse `.lean` files to JSON, watch for changes, or scaffold sample
                datasets.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-6 font-mono text-sm text-slate-100 shadow-lg">
              <pre>{`npm install -g @lean/cli

# Parse LEAN into JSON
lean parse data.lean --pretty

# Format JSON back to LEAN
lean format data.json --indent=4

# Validate strict mode
lean validate data.lean --strict`}</pre>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-primary/50 p-10 text-center shadow-inner">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Ecosystem</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">
            One repo, five experiences
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-600">
            Core parser + serializer, CLI, VS Code extension, interactive playground, and this
            website all live inside the `/packages` workspace. Clone once, contribute everywhere.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} LEAN Format. MIT License.</p>
      </footer>
    </div>
  );
}

