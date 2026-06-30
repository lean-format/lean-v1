import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { parse } from '@lean-format/core';
function computeDiff(left, right) {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    const result = [];
    let leftIdx = 0;
    let rightIdx = 0;
    while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
        if (leftIdx < leftLines.length && rightIdx < rightLines.length && leftLines[leftIdx] === rightLines[rightIdx]) {
            result.push({
                type: 'same',
                left: leftLines[leftIdx],
                right: rightLines[rightIdx],
                lineNumLeft: leftIdx + 1,
                lineNumRight: rightIdx + 1,
            });
            leftIdx++;
            rightIdx++;
        }
        else if (rightIdx >= rightLines.length || (leftIdx < leftLines.length && leftLines[leftIdx] !== rightLines[rightIdx])) {
            result.push({
                type: 'removed',
                left: leftLines[leftIdx] || null,
                right: null,
                lineNumLeft: leftIdx + 1,
                lineNumRight: null,
            });
            leftIdx++;
        }
        else {
            result.push({
                type: 'added',
                left: null,
                right: rightLines[rightIdx],
                lineNumLeft: null,
                lineNumRight: rightIdx + 1,
            });
            rightIdx++;
        }
    }
    return result;
}
export function DiffView({ left, right, leftTitle = 'Original', rightTitle = 'Modified' }) {
    const diff = useMemo(() => computeDiff(left, right), [left, right]);
    const stats = useMemo(() => {
        let added = 0, removed = 0;
        for (const line of diff) {
            if (line.type === 'added')
                added++;
            if (line.type === 'removed')
                removed++;
        }
        return { added, removed, total: diff.length };
    }, [diff]);
    const leftAst = useMemo(() => parse(left), [left]);
    const rightAst = useMemo(() => parse(right), [right]);
    return (_jsxs("div", { className: "lean-card", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex gap-2 text-xs", children: [_jsxs("span", { className: "lean-badge", style: { backgroundColor: '#dcfce7', color: '#166534' }, children: ["+", stats.added, " added"] }), _jsxs("span", { className: "lean-badge", style: { backgroundColor: '#fee2e2', color: '#991b1b' }, children: ["-", stats.removed, " removed"] }), _jsxs("span", { className: "lean-badge", children: [stats.total, " lines"] })] }), _jsxs("div", { className: "flex gap-2 text-xs", children: [leftAst.success && (_jsxs("span", { className: "text-green-600 dark:text-green-400", children: ["\u2713 ", leftAst.ast.length, " nodes"] })), rightAst.success && (_jsxs("span", { className: "text-green-600 dark:text-green-400", children: ["\u2713 ", rightAst.ast.length, " nodes"] }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-0 border border-[var(--lean-border)] rounded-md overflow-hidden", children: [_jsxs("div", { className: "border-r border-[var(--lean-border)]", children: [_jsx("div", { className: "bg-[var(--lean-surface)] px-3 py-1.5 text-xs font-medium border-b border-[var(--lean-border)]", children: leftTitle }), _jsx("div", { className: "font-mono text-xs leading-5", children: diff.map((line, idx) => (_jsxs("div", { className: `flex px-2 ${line.type === 'removed'
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                        : line.type === 'same'
                                            ? ''
                                            : 'opacity-30'}`, children: [_jsx("span", { className: "w-8 text-right text-[var(--lean-text-secondary)] select-none mr-2 shrink-0", children: line.lineNumLeft || '' }), _jsx("span", { className: "w-4 shrink-0", children: line.type === 'removed' ? '−' : ' ' }), _jsx("span", { className: "truncate", children: line.left || '' })] }, idx))) })] }), _jsxs("div", { children: [_jsx("div", { className: "bg-[var(--lean-surface)] px-3 py-1.5 text-xs font-medium border-b border-[var(--lean-border)]", children: rightTitle }), _jsx("div", { className: "font-mono text-xs leading-5", children: diff.map((line, idx) => (_jsxs("div", { className: `flex px-2 ${line.type === 'added'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                        : line.type === 'same'
                                            ? ''
                                            : 'opacity-30'}`, children: [_jsx("span", { className: "w-8 text-right text-[var(--lean-text-secondary)] select-none mr-2 shrink-0", children: line.lineNumRight || '' }), _jsx("span", { className: "w-4 shrink-0", children: line.type === 'added' ? '+' : ' ' }), _jsx("span", { className: "truncate", children: line.right || '' })] }, idx))) })] })] })] }));
}
