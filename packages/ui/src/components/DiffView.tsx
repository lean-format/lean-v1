import { useMemo } from 'react';
import { parse } from '@lean-format/core';

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  left: string | null;
  right: string | null;
  lineNumLeft: number | null;
  lineNumRight: number | null;
}

function computeDiff(left: string, right: string): DiffLine[] {
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const result: DiffLine[] = [];

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
    } else if (rightIdx >= rightLines.length || (leftIdx < leftLines.length && leftLines[leftIdx] !== rightLines[rightIdx])) {
      result.push({
        type: 'removed',
        left: leftLines[leftIdx] || null,
        right: null,
        lineNumLeft: leftIdx + 1,
        lineNumRight: null,
      });
      leftIdx++;
    } else {
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

interface DiffViewProps {
  left: string;
  right: string;
  leftTitle?: string;
  rightTitle?: string;
}

export function DiffView({ left, right, leftTitle = 'Original', rightTitle = 'Modified' }: DiffViewProps) {
  const diff = useMemo(() => computeDiff(left, right), [left, right]);

  const stats = useMemo(() => {
    let added = 0, removed = 0;
    for (const line of diff) {
      if (line.type === 'added') added++;
      if (line.type === 'removed') removed++;
    }
    return { added, removed, total: diff.length };
  }, [diff]);

  const leftAst = useMemo(() => parse(left), [left]);
  const rightAst = useMemo(() => parse(right), [right]);

  return (
    <div className="lean-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 text-xs">
          <span className="lean-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            +{stats.added} added
          </span>
          <span className="lean-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
            -{stats.removed} removed
          </span>
          <span className="lean-badge">{stats.total} lines</span>
        </div>
        <div className="flex gap-2 text-xs">
          {leftAst.success && (
            <span className="text-green-600 dark:text-green-400">✓ {leftAst.ast.length} nodes</span>
          )}
          {rightAst.success && (
            <span className="text-green-600 dark:text-green-400">✓ {rightAst.ast.length} nodes</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-0 border border-[var(--lean-border)] rounded-md overflow-hidden">
        <div className="border-r border-[var(--lean-border)]">
          <div className="bg-[var(--lean-surface)] px-3 py-1.5 text-xs font-medium border-b border-[var(--lean-border)]">
            {leftTitle}
          </div>
          <div className="font-mono text-xs leading-5">
            {diff.map((line, idx) => (
              <div
                key={idx}
                className={`flex px-2 ${
                  line.type === 'removed'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : line.type === 'same'
                    ? ''
                    : 'opacity-30'
                }`}
              >
                <span className="w-8 text-right text-[var(--lean-text-secondary)] select-none mr-2 shrink-0">
                  {line.lineNumLeft || ''}
                </span>
                <span className="w-4 shrink-0">{line.type === 'removed' ? '−' : ' '}</span>
                <span className="truncate">{line.left || ''}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="bg-[var(--lean-surface)] px-3 py-1.5 text-xs font-medium border-b border-[var(--lean-border)]">
            {rightTitle}
          </div>
          <div className="font-mono text-xs leading-5">
            {diff.map((line, idx) => (
              <div
                key={idx}
                className={`flex px-2 ${
                  line.type === 'added'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : line.type === 'same'
                    ? ''
                    : 'opacity-30'
                }`}
              >
                <span className="w-8 text-right text-[var(--lean-text-secondary)] select-none mr-2 shrink-0">
                  {line.lineNumRight || ''}
                </span>
                <span className="w-4 shrink-0">{line.type === 'added' ? '+' : ' '}</span>
                <span className="truncate">{line.right || ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
