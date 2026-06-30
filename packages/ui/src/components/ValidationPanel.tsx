import { ValidationResult } from '@lean-format/core';

interface ValidationPanelProps {
  results: ValidationResult[];
  onJumpToPosition?: (line: number, column: number) => void;
}

const severityStyles: Record<string, string> = {
  error: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
  info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
};

const severityIcons: Record<string, string> = {
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function ValidationPanel({ results, onJumpToPosition }: ValidationPanelProps) {
  if (results.length === 0) {
    return (
      <div className="lean-card text-center py-4">
        <span className="text-green-600 dark:text-green-400 text-sm">✓ No validation issues found</span>
      </div>
    );
  }

  const errorCount = results.filter((r) => r.severity === 'error').length;
  const warningCount = results.filter((r) => r.severity === 'warning').length;
  const infoCount = results.filter((r) => r.severity === 'info').length;

  return (
    <div className="lean-card">
      <div className="flex gap-3 mb-3 text-xs">
        {errorCount > 0 && <span className="lean-badge-error">{errorCount} errors</span>}
        {warningCount > 0 && <span className="lean-badge-warning">{warningCount} warnings</span>}
        {infoCount > 0 && <span className="lean-badge-info">{infoCount} info</span>}
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 p-2 border-l-2 rounded text-sm cursor-pointer transition-colors hover:bg-[var(--lean-border)]/20 ${severityStyles[result.severity] || ''}`}
            onClick={() => onJumpToPosition?.(result.loc.start.line, result.loc.start.column)}
          >
            <span className="mt-0.5 text-xs">{severityIcons[result.severity] || '•'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--lean-text-secondary)]">
                Line {result.loc.start.line}:{result.loc.start.column}
              </p>
              <p className="text-sm truncate">{result.message}</p>
              {result.code && (
                <code className="text-xs text-[var(--lean-text-secondary)]">{result.code}</code>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
