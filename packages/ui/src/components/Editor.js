import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { leanFormatExtension } from '@lean-format/editor';
import { format, validate } from '@lean-format/core';
export function Editor({ value, onChange, theme = 'light', readOnly = false, height = '400px', onValidate }) {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    useEffect(() => {
        if (!editorRef.current)
            return;
        const extensions = [
            basicSetup,
            ...leanFormatExtension(),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    const doc = update.state.doc.toString();
                    onChange?.(doc);
                    if (onValidate) {
                        onValidate(validate(doc));
                    }
                }
            }),
            EditorView.editable.of(!readOnly),
            EditorView.theme({
                '&': { height },
                '.cm-scroller': { overflow: 'auto' },
            }),
        ];
        if (theme === 'dark') {
            extensions.push(EditorView.theme({
                '&': { backgroundColor: '#1e293b', color: '#f1f5f9' },
                '.cm-gutters': { backgroundColor: '#0f172a', color: '#64748b', borderRight: '1px solid #334155' },
                '.cm-activeLineGutter': { backgroundColor: '#1e293b' },
                '.cm-activeLine': { backgroundColor: '#1e293b' },
                '.cm-cursor': { borderLeftColor: '#6366f1' },
                '.cm-selectionBackground': { backgroundColor: '#334155' },
            }, { dark: true }));
        }
        const state = EditorState.create({
            doc: value,
            extensions,
        });
        const view = new EditorView({
            state,
            parent: editorRef.current,
        });
        viewRef.current = view;
        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, []);
    useEffect(() => {
        const view = viewRef.current;
        if (view && value !== view.state.doc.toString()) {
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: value },
            });
        }
    }, [value]);
    const handleFormat = useCallback(() => {
        if (!viewRef.current)
            return;
        const doc = viewRef.current.state.doc.toString();
        const formatted = format(doc);
        if (formatted !== doc) {
            viewRef.current.dispatch({
                changes: { from: 0, to: viewRef.current.state.doc.length, insert: formatted },
            });
        }
    }, []);
    const handleValidate = useCallback(() => {
        if (!viewRef.current)
            return;
        const doc = viewRef.current.state.doc.toString();
        const results = validate(doc);
        onValidate?.(results);
        return results;
    }, [onValidate]);
    return (_jsxs("div", { className: "lean-editor-wrapper", children: [_jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("button", { onClick: handleFormat, className: "lean-btn-primary text-xs px-3 py-1", children: "Format" }), _jsx("button", { onClick: handleValidate, className: "lean-btn-secondary text-xs px-3 py-1", children: "Validate" })] }), _jsx("div", { ref: editorRef, className: "border border-[var(--lean-border)] rounded-md overflow-hidden" })] }));
}
