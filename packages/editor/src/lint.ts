import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { validate as coreValidate } from '@lean-format/core';

export function leanLint(view: EditorView): Diagnostic[] {
  const doc = view.state.doc.toString();
  const results = coreValidate(doc);

  return results.map((r) => {
    const from = view.state.doc.line(r.loc.start.line);
    const to = view.state.doc.line(r.loc.end.line);
    return {
      from: from.from + Math.max(0, r.loc.start.column - 1),
      to: to.from + Math.max(0, r.loc.end.column - 1),
      message: r.message,
      severity: r.severity === 'error' ? 'error' : r.severity === 'warning' ? 'warning' : 'info',
    };
  });
}
