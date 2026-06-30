import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const severityStyles = {
    error: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
    info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
};
const severityIcons = {
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};
export function ValidationPanel({ results, onJumpToPosition }) {
    if (results.length === 0) {
        return (_jsx("div", { className: "lean-card text-center py-4", children: _jsx("span", { className: "text-green-600 dark:text-green-400 text-sm", children: "\u2713 No validation issues found" }) }));
    }
    const errorCount = results.filter((r) => r.severity === 'error').length;
    const warningCount = results.filter((r) => r.severity === 'warning').length;
    const infoCount = results.filter((r) => r.severity === 'info').length;
    return (_jsxs("div", { className: "lean-card", children: [_jsxs("div", { className: "flex gap-3 mb-3 text-xs", children: [errorCount > 0 && _jsxs("span", { className: "lean-badge-error", children: [errorCount, " errors"] }), warningCount > 0 && _jsxs("span", { className: "lean-badge-warning", children: [warningCount, " warnings"] }), infoCount > 0 && _jsxs("span", { className: "lean-badge-info", children: [infoCount, " info"] })] }), _jsx("div", { className: "space-y-1 max-h-64 overflow-y-auto", children: results.map((result, idx) => (_jsxs("div", { className: `flex items-start gap-2 p-2 border-l-2 rounded text-sm cursor-pointer transition-colors hover:bg-[var(--lean-border)]/20 ${severityStyles[result.severity] || ''}`, onClick: () => onJumpToPosition?.(result.loc.start.line, result.loc.start.column), children: [_jsx("span", { className: "mt-0.5 text-xs", children: severityIcons[result.severity] || '•' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-xs text-[var(--lean-text-secondary)]", children: ["Line ", result.loc.start.line, ":", result.loc.start.column] }), _jsx("p", { className: "text-sm truncate", children: result.message }), result.code && (_jsx("code", { className: "text-xs text-[var(--lean-text-secondary)]", children: result.code }))] })] }, idx))) })] }));
}
