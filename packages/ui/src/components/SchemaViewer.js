import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
function TypeIcon({ type }) {
    const icons = {
        model: '📦',
        enum: '📋',
        relation: '🔗',
        constraint: '🔒',
        type: '🏷️',
        doc: '📄',
        field: '🔤',
    };
    return _jsx("span", { className: "mr-1.5", children: icons[type] || '📌' });
}
function SchemaNode({ node, depth = 0, onNodeClick }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    return (_jsxs("div", { className: "select-none", children: [_jsxs("div", { className: "flex items-center gap-1 py-1 px-2 rounded hover:bg-[var(--lean-border)]/30 cursor-pointer transition-colors", style: { paddingLeft: `${depth * 20 + 8}px` }, onClick: () => {
                    if (hasChildren)
                        setExpanded(!expanded);
                    onNodeClick?.(node);
                }, children: [hasChildren && (_jsx("span", { className: "text-xs w-4 text-center text-[var(--lean-text-secondary)]", children: expanded ? '▼' : '▶' })), !hasChildren && _jsx("span", { className: "w-4" }), _jsx(TypeIcon, { type: node.type }), _jsx("span", { className: "font-medium text-sm", children: node.name || node.type }), node.value !== undefined && (_jsxs("span", { className: "text-xs text-[var(--lean-text-secondary)] ml-1", children: [": ", typeof node.value === 'string' ? `"${node.value}"` : String(node.value)] })), node.type !== 'field' && (_jsx("span", { className: "text-xs text-lean-primary ml-2 px-1.5 py-0.5 rounded-full bg-lean-50 dark:bg-lean-900/30", children: node.type }))] }), expanded && hasChildren && (_jsx("div", { children: node.children.map((child, i) => (_jsx(SchemaNode, { node: child, depth: depth + 1, onNodeClick: onNodeClick }, `${child.name || child.type}-${i}`))) }))] }));
}
export function SchemaViewer({ ast, onNodeClick }) {
    const stats = useMemo(() => {
        let modelCount = 0;
        let enumCount = 0;
        let relationCount = 0;
        for (const node of ast) {
            if (node.type === 'model')
                modelCount++;
            else if (node.type === 'enum')
                enumCount++;
            else if (node.type === 'relation')
                relationCount++;
        }
        return { modelCount, enumCount, relationCount };
    }, [ast]);
    if (ast.length === 0) {
        return (_jsx("div", { className: "lean-card text-center py-12", children: _jsx("p", { className: "text-[var(--lean-text-secondary)]", children: "No schema to display. Write some LEAN Format code to see the schema tree." }) }));
    }
    return (_jsxs("div", { className: "lean-card", children: [_jsxs("div", { className: "flex gap-3 mb-4 text-xs", children: [_jsxs("span", { className: "lean-badge-info", children: [stats.modelCount, " models"] }), _jsxs("span", { className: "lean-badge-warning", children: [stats.enumCount, " enums"] }), _jsxs("span", { className: "lean-badge", children: [stats.relationCount, " relations"] })] }), _jsx("div", { className: "space-y-0.5", children: ast.map((node, i) => (_jsx(SchemaNode, { node: node, depth: 0, onNodeClick: onNodeClick }, `${node.name || node.type}-${i}`))) })] }));
}
