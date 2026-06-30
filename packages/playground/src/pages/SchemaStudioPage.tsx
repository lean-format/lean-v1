import React, { useMemo, useState, useCallback } from 'react';
import { SchemaViewer } from '@lean-format/ui';
import { parse, ASTNode, format, validate } from '@lean-format/core';
import { SCHEMA_EXAMPLE } from '../data/examples';

export function SchemaStudioPage() {
  const [code, setCode] = useState(SCHEMA_EXAMPLE);
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const parseResult = useMemo(() => parse(code), [code]);

  const filteredAst = useMemo(() => {
    if (!searchQuery) return parseResult.ast;
    const q = searchQuery.toLowerCase();
    function filterNodes(nodes: ASTNode[]): ASTNode[] {
      const result: ASTNode[] = [];
      for (const node of nodes) {
        const nameMatch = node.name?.toLowerCase().includes(q);
        const typeMatch = node.type.toLowerCase().includes(q);
        if (nameMatch || typeMatch) {
          result.push(node);
        } else if (node.children) {
          const filtered = filterNodes(node.children);
          if (filtered.length > 0) {
            result.push({ ...node, children: filtered });
          }
        }
      }
      return result;
    }
    return filterNodes(parseResult.ast);
  }, [parseResult.ast, searchQuery]);

  const handleNodeClick = useCallback((node: ASTNode) => {
    console.log('Selected node:', node.type, node.name);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, node: ASTNode) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: node.type, name: node.name }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schema Studio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visual schema tree viewer with drag-and-drop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="lean-btn-secondary text-xs px-2 py-1"
            >
              −
            </button>
            <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="lean-btn-secondary text-xs px-2 py-1"
            >
              +
            </button>
          </div>
          {parseResult.errors.length > 0 && (
            <span className="lean-badge-error">{parseResult.errors.length} errors</span>
          )}
          {parseResult.success && (
            <span className="text-green-600 dark:text-green-400 text-xs">✓ Valid</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="lean-input flex-1 max-w-xs"
        />
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="lean-input flex-1 font-mono text-xs h-24 resize-none"
          placeholder="Paste LEAN Format schema..."
        />
      </div>

      <div
        className="transition-transform origin-top-left"
        style={{ transform: `scale(${zoom})` }}
      >
        {parseResult.success ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAst.map((node, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, node)}
                className="lean-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {node.type === 'model' ? '📦' : node.type === 'enum' ? '📋' : node.type === 'relation' ? '🔗' : '📄'}
                  </span>
                  <span className="font-bold">{node.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{node.type}</span>
                </div>
                {node.children && (
                  <div className="ml-2 border-l-2 border-indigo-200 dark:border-indigo-800 pl-3 space-y-1">
                    {node.children.map((child, ci) => (
                      <div key={ci} className="flex items-center gap-1 text-xs">
                        <span className="text-gray-400">{child.type === 'field' ? '↳' : '⊟'}</span>
                        <span className={child.type === 'field' ? '' : 'font-medium'}>{child.name}</span>
                        {child.value !== undefined && (
                          <span className="text-gray-400">
                            : {typeof child.value === 'string' ? `"${child.value}"` : String(child.value)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="lean-card text-center py-12">
            <p className="text-red-500">Failed to parse schema</p>
            <div className="mt-2 space-y-1">
              {parseResult.errors.map((err, i) => (
                <p key={i} className="text-sm text-gray-500">
                  {err.message}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
