export default function GrammarPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-[#6366f1] mb-4">Formal Grammar</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">The formal LEAN Format grammar in EBNF notation.</p>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{`file       = { top-level-block }
top-level  = model | enum | relation | constraint | type | doc
model      = "model" identifier "{" { field } "}"
enum       = "enum" identifier "{" { identifier } "}"
relation   = "relation" identifier "->" identifier "{" { relation-field } "}"
constraint = "constraint" identifier "{" { expression } "}"
type       = "type" identifier "=" type-expr
doc        = "doc" string-value

field          = identifier ":" type-expr
relation-field = identifier ":" [ "?" ] "->" identifier

type-expr = identifier | "String" | "Number" | "Boolean" | "Date" | "ID" | "JSON"
identifier = letter { letter | digit | "_" }
string-value = """ { char } """
number-value = digit { digit } [ "." digit { digit } ]
comment = "//" { char } newline | "/*" { char } "*/"`}</code></pre>
    </div>
  );
}
