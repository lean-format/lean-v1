import { useMemo, useState } from 'react';
import { ASTNode } from '@lean-format/core';

interface SchemaViewerProps {
  ast: ASTNode[];
  onNodeClick?: (node: ASTNode) => void;
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    model: '📦',
    enum: '📋',
    relation: '🔗',
    constraint: '🔒',
    type: '🏷️',
    doc: '📄',
    field: '🔤',
  };
  return <span className="mr-1.5">{icons[type] || '📌'}</span>;
}

function SchemaNode({ node, depth = 0, onNodeClick }: { node: ASTNode; depth: number; onNodeClick?: (node: ASTNode) => void }) {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 py-1 px-2 rounded hover:bg-[var(--lean-border)]/30 cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onNodeClick?.(node);
        }}
      >
        {hasChildren && (
          <span className="text-xs w-4 text-center text-[var(--lean-text-secondary)]">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        <TypeIcon type={node.type} />
        <span className="font-medium text-sm">{node.name || node.type}</span>
        {node.value !== undefined && (
          <span className="text-xs text-[var(--lean-text-secondary)] ml-1">
            : {typeof node.value === 'string' ? `"${node.value}"` : String(node.value)}
          </span>
        )}
        {node.type !== 'field' && (
          <span className="text-xs text-lean-primary ml-2 px-1.5 py-0.5 rounded-full bg-lean-50 dark:bg-lean-900/30">
            {node.type}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child, i) => (
            <SchemaNode key={`${child.name || child.type}-${i}`} node={child} depth={depth + 1} onNodeClick={onNodeClick} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaViewer({ ast, onNodeClick }: SchemaViewerProps) {
  const stats = useMemo(() => {
    let modelCount = 0;
    let enumCount = 0;
    let relationCount = 0;
    for (const node of ast) {
      if (node.type === 'model') modelCount++;
      else if (node.type === 'enum') enumCount++;
      else if (node.type === 'relation') relationCount++;
    }
    return { modelCount, enumCount, relationCount };
  }, [ast]);

  if (ast.length === 0) {
    return (
      <div className="lean-card text-center py-12">
        <p className="text-[var(--lean-text-secondary)]">No schema to display. Write some LEAN Format code to see the schema tree.</p>
      </div>
    );
  }

  return (
    <div className="lean-card">
      <div className="flex gap-3 mb-4 text-xs">
        <span className="lean-badge-info">{stats.modelCount} models</span>
        <span className="lean-badge-warning">{stats.enumCount} enums</span>
        <span className="lean-badge">{stats.relationCount} relations</span>
      </div>
      <div className="space-y-0.5">
        {ast.map((node, i) => (
          <SchemaNode key={`${node.name || node.type}-${i}`} node={node} depth={0} onNodeClick={onNodeClick} />
        ))}
      </div>
    </div>
  );
}
