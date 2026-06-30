import { CompletionContext, CompletionResult, autocompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { SyntaxNode } from '@lezer/common';

const KEYWORDS = ['model', 'enum', 'relation', 'constraint', 'type', 'doc'];

const BUILTIN_TYPES = ['String', 'Number', 'Boolean', 'Date', 'ID', 'JSON'];

export function leanCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\w$]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const options: { label: string; type: string; detail?: string }[] = [];

  options.push(
    ...KEYWORDS.map((kw) => ({
      label: kw,
      type: 'keyword' as const,
      detail: 'LEAN block keyword',
    }))
  );

  options.push(
    ...BUILTIN_TYPES.map((bt) => ({
      label: bt,
      type: 'type' as const,
      detail: 'built-in type',
    }))
  );

  const tree = syntaxTree(context.state);
  let cur: SyntaxNode | null = tree.resolve(context.pos, -1);
  while (cur) {
    if (cur.name === 'Model' || cur.name === 'Enum' || cur.name === 'Type') {
      for (let ch = cur.firstChild; ch; ch = ch.nextSibling) {
        if (ch.name === 'Name' && ch.type.isTop) {
          const name = context.state.sliceDoc(ch.from, ch.to);
          if (ch.from < context.pos) {
            options.push({
              label: name,
              type: 'type',
              detail: 'type reference',
            });
          }
        }
      }
    }
    cur = cur.parent;
  }

  return {
    from: word.from,
    options,
  };
}

export function leanAutocomplete() {
  return autocompletion({ override: [leanCompletionSource] });
}
