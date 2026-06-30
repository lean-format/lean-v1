import React, { useState, useMemo } from 'react';
import { DiffView } from '@lean-format/ui';
import { parse } from '@lean-format/core';
import { DIFF_EXAMPLE_LEFT, DIFF_EXAMPLE_RIGHT } from '../data/examples';

export function DiffEvolutionPage() {
  const [leftCode, setLeftCode] = useState(DIFF_EXAMPLE_LEFT);
  const [rightCode, setRightCode] = useState(DIFF_EXAMPLE_RIGHT);

  const leftParse = useMemo(() => parse(leftCode), [leftCode]);
  const rightParse = useMemo(() => parse(rightCode), [rightCode]);

  const driftIndicators = useMemo(() => {
    const indicators: { type: string; left: string; right: string; status: 'added' | 'removed' | 'modified' }[] = [];

    const leftModels = new Map(leftParse.ast.filter((n) => n.type === 'model').map((n) => [n.name, n]));
    const rightModels = new Map(rightParse.ast.filter((n) => n.type === 'model').map((n) => [n.name, n]));

    for (const [name, node] of rightModels) {
      if (!leftModels.has(name)) {
        indicators.push({ type: 'model', left: '', right: name!, status: 'added' });
      }
    }
    for (const [name, node] of leftModels) {
      if (!rightModels.has(name)) {
        indicators.push({ type: 'model', left: name!, right: '', status: 'removed' });
      } else {
        const leftFields = new Set(node.children?.filter((c) => c.type === 'field').map((c) => c.name) || []);
        const rightFields = new Set(rightModels.get(name)?.children?.filter((c) => c.type === 'field').map((c) => c.name) || []);
        for (const f of rightFields) {
          if (!leftFields.has(f)) {
            indicators.push({ type: 'field', left: `${name}.${f}`, right: `${name}.${f}`, status: 'added' });
          }
        }
        for (const f of leftFields) {
          if (!rightFields.has(f)) {
            indicators.push({ type: 'field', left: `${name}.${f}`, right: `${name}.${f}`, status: 'removed' });
          }
        }
      }
    }

    return indicators;
  }, [leftParse, rightParse]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Diff Evolution</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Compare schema versions side-by-side with drift indicators
        </p>
      </div>

      <div className="flex gap-1 mb-2">
        <div className="flex-1">
          <textarea
            value={leftCode}
            onChange={(e) => setLeftCode(e.target.value)}
            className="lean-input font-mono text-xs h-32 resize-none"
            placeholder="Original schema..."
          />
        </div>
        <div className="flex-1">
          <textarea
            value={rightCode}
            onChange={(e) => setRightCode(e.target.value)}
            className="lean-input font-mono text-xs h-32 resize-none"
            placeholder="Modified schema..."
          />
        </div>
      </div>

      <DiffView left={leftCode} right={rightCode} />

      {driftIndicators.length > 0 && (
        <div className="lean-card">
          <h3 className="text-sm font-medium mb-2">Drift Indicators</h3>
          <div className="space-y-1">
            {driftIndicators.map((d, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                  d.status === 'added'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : d.status === 'removed'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : ''
                }`}
              >
                <span className="font-medium">{d.status === 'added' ? '+ Added' : d.status === 'removed' ? '- Removed' : '∼ Modified'}</span>
                <span className="text-gray-400">|</span>
                <span>{d.type}</span>
                <span className="text-gray-400">|</span>
                <code className="font-mono">{d.right || d.left}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 text-xs text-gray-400">
        <span>Left: {leftParse.success ? `${leftParse.ast.length} top-level nodes` : 'Parse error'}</span>
        <span>|</span>
        <span>Right: {rightParse.success ? `${rightParse.ast.length} top-level nodes` : 'Parse error'}</span>
        <span>|</span>
        <span>Drift entries: {driftIndicators.length}</span>
      </div>
    </div>
  );
}
