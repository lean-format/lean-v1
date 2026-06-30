import React, { useState, useCallback, useMemo } from 'react';
import { Editor, ValidationPanel } from '@lean-format/ui';
import { parse, validate, format, ValidationResult } from '@lean-format/core';
import { PLAYGROUND_EXAMPLE } from '../data/examples';

export function PlaygroundPage() {
  const [code, setCode] = useState(PLAYGROUND_EXAMPLE);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [cacheSim, setCacheSim] = useState<{ hits: number; misses: number }>({ hits: 0, misses: 0 });

  const parseResult = useMemo(() => {
    const result = parse(code);
    setCacheSim((prev) => ({ ...prev, hits: prev.hits + 1, misses: prev.misses + 1 }));
    return result;
  }, [code]);

  const astNodeCount = useMemo(() => {
    if (!parseResult.success) return 0;
    let count = 0;
    function walk(nodes: { children?: any[] }[]) {
      for (const n of nodes) {
        count++;
        if (n.children) walk(n.children);
      }
    }
    walk(parseResult.ast);
    return count;
  }, [parseResult]);

  const handleValidate = useCallback((results: ValidationResult[]) => {
    setValidationResults(results);
  }, []);

  const handleFormat = useCallback(() => {
    const formatted = format(code);
    if (formatted !== code) {
      setCode(formatted);
    }
  }, [code]);

  const handleJumpToPosition = useCallback((line: number, column: number) => {
    // In a real app, we'd focus the editor at this position
    console.log(`Jump to line ${line}, column ${column}`);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Playground</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Write and test LEAN Format schemas
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{astNodeCount} AST nodes</span>
          <span>{code.split('\n').length} lines</span>
          <span>Cache: {cacheSim.hits}h/{cacheSim.misses}m</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Editor
            value={code}
            onChange={(v) => setCode(v)}
            onValidate={handleValidate}
            height="500px"
          />
        </div>
        <div className="space-y-4">
          <ValidationPanel results={validationResults} onJumpToPosition={handleJumpToPosition} />

          <div className="lean-card">
            <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={handleFormat} className="lean-btn-primary w-full text-sm">
                Format Code
              </button>
              <button
                onClick={() => {
                  const results = validate(code);
                  setValidationResults(results);
                }}
                className="lean-btn-secondary w-full text-sm"
              >
                Run Validation
              </button>
              <button
                onClick={() => {
                  setCode(PLAYGROUND_EXAMPLE);
                  setValidationResults([]);
                }}
                className="lean-btn-secondary w-full text-sm"
              >
                Reset Example
              </button>
            </div>
          </div>

          {parseResult.success && (
            <div className="lean-card">
              <h3 className="text-sm font-medium mb-2">AST Summary</h3>
              <div className="space-y-1 text-xs">
                {parseResult.ast.map((node, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{node.type}</span>
                    <span className="font-mono">{node.name || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
