import type { QueryResult } from './types.js';
import { LeanParseError } from './errors.js';

export function query(data: unknown, path: string): QueryResult {
  if (!path || path.trim() === '') {
    return { value: data, path: '', exists: true };
  }

  const parts = parsePath(path);
  let current: unknown = data;
  let currentPath = '';

  for (const part of parts) {
    if (current === null || current === undefined) {
      return { value: undefined, path, exists: false };
    }

    if (part.type === 'key') {
      const name = part.name!;
      currentPath = currentPath ? `${currentPath}.${name}` : name;

      if (typeof current !== 'object' || current === null) {
        return { value: undefined, path, exists: false };
      }

      if (Array.isArray(current)) {
        return { value: undefined, path, exists: false };
      }

      const obj = current as Record<string, unknown>;
      if (!(name in obj)) {
        return { value: undefined, path, exists: false };
      }
      current = obj[name];
    } else if (part.type === 'index') {
      const index = part.index!;
      currentPath = `${currentPath}[${index}]`;

      if (!Array.isArray(current)) {
        return { value: undefined, path, exists: false };
      }

      if (index < 0 || index >= current.length) {
        return { value: undefined, path, exists: false };
      }
      current = current[index];
    } else if (part.type === 'wildcard') {
      currentPath = `${currentPath}[*]`;

      if (!Array.isArray(current)) {
        return { value: undefined, path, exists: false };
      }

      const partIndex = parts.indexOf(part);
      const remainingPath = parts.slice(partIndex + 1);
      if (remainingPath.length === 0) {
        return { value: current, path, exists: true };
      }

      const results: unknown[] = [];
      for (const item of current) {
        const subPath = remainingPath
          .map((p) => (p.type === 'key' ? p.name! : `[${p.type === 'index' ? p.index! : '*'}]`))
          .join('.');
        const result = query(item, subPath);
        if (result.exists) {
          results.push(result.value);
        }
      }
      return { value: results, path, exists: results.length > 0 };
    }
  }

  return { value: current, path, exists: true };
}

interface PathPart {
  type: 'key' | 'index' | 'wildcard';
  name?: string;
  index?: number;
}

function parsePath(path: string): PathPart[] {
  const parts: PathPart[] = [];
  const regex = /(?:([^.\[\]]+)|\[(\d+|\*)\])/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      parts.push({ type: 'key', name: match[1] });
    } else if (match[2] === '*') {
      parts.push({ type: 'wildcard' });
    } else {
      const idx = parseInt(match[2], 10);
      if (isNaN(idx)) {
        throw new LeanParseError(`Invalid array index in query path: '${match[2]}'`, 0, 0);
      }
      parts.push({ type: 'index', index: idx });
    }
  }

  return parts;
}
