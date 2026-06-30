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
    } else if (part.type === 'filter') {
      currentPath = `${currentPath}[?${part.filterExpr}]`;

      if (!Array.isArray(current)) {
        return { value: undefined, path, exists: false };
      }

      const partIndex = parts.indexOf(part);
      const remainingPath = parts.slice(partIndex + 1);
      const filtered = applyFilter(current, part.filterExpr!);

      if (remainingPath.length === 0) {
        return { value: filtered, path, exists: filtered.length > 0 };
      }

      const results: unknown[] = [];
      for (const item of filtered) {
        const subPath = remainingPath
          .map((p) => (p.type === 'key' ? p.name! : `[${p.type === 'index' ? p.index! : '*'}]`))
          .join('.');
        const result = query(item, subPath);
        if (result.exists) {
          results.push(result.value);
        }
      }
      return { value: results, path, exists: results.length > 0 };
    } else if (part.type === 'projection') {
      currentPath = `${currentPath}{${part.projectionKeys!.join(', ')}}`;

      if (!Array.isArray(current)) {
        return { value: undefined, path, exists: false };
      }

      const projected = current.map((item) => {
        if (typeof item !== 'object' || item === null) return item;
        const obj = item as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const key of part.projectionKeys!) {
          if (key in obj) {
            result[key] = obj[key];
          }
        }
        return result;
      });

      const partIndex = parts.indexOf(part);
      const remainingPath = parts.slice(partIndex + 1);
      if (remainingPath.length === 0) {
        return { value: projected, path, exists: projected.length > 0 };
      }

      const results: unknown[] = [];
      for (const item of projected) {
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
  type: 'key' | 'index' | 'wildcard' | 'filter' | 'projection';
  name?: string;
  index?: number;
  filterExpr?: string;
  projectionKeys?: string[];
}

function parsePath(path: string): PathPart[] {
  const parts: PathPart[] = [];
  const regex = /(?:([^.[\]{}?]+)|\[(\d+|\*)\]|\[\?(.+?)\]|\{(.+?)\})/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      parts.push({ type: 'key', name: match[1] });
    } else if (match[2] === '*') {
      parts.push({ type: 'wildcard' });
    } else if (match[3] !== undefined) {
      parts.push({ type: 'filter', filterExpr: match[3].trim() });
    } else if (match[4] !== undefined) {
      const keys = match[4].split(',').map(k => k.trim()).filter(k => k.length > 0);
      parts.push({ type: 'projection', projectionKeys: keys });
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

type FilterOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'truthy';

interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

function parseFilterExpression(expr: string): FilterExpression {
  expr = expr.trim();

  const containsMatch = expr.match(/^contains\(([^,]+),\s*(.+)\)$/);
  if (containsMatch) {
    return { field: containsMatch[1].trim(), operator: 'contains', value: parseLiteral(containsMatch[2].trim()) };
  }

  const startsWithMatch = expr.match(/^starts_with\(([^,]+),\s*(.+)\)$/);
  if (startsWithMatch) {
    return { field: startsWithMatch[1].trim(), operator: 'startsWith', value: parseLiteral(startsWithMatch[2].trim()) };
  }

  const opMatch = expr.match(/^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (opMatch) {
    return { field: opMatch[1], operator: opMatch[2] as FilterOperator, value: parseLiteral(opMatch[3].trim()) };
  }

  return { field: expr, operator: 'truthy', value: undefined };
}

function parseLiteral(s: string): unknown {
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (s === 'undefined') return undefined;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  const num = Number(s);
  if (!isNaN(num) && s.length > 0) {
    return num;
  }
  return s;
}

function applyFilter(arr: unknown[], expr: string): unknown[] {
  const filterExpr = parseFilterExpression(expr);

  return arr.filter((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const obj = item as Record<string, unknown>;
    const fieldValue = resolveField(obj, filterExpr.field);

    switch (filterExpr.operator) {
      case '==':
        return fieldValue === filterExpr.value;
      case '!=':
        return fieldValue !== filterExpr.value;
      case '>':
        return typeof fieldValue === 'number' && typeof filterExpr.value === 'number' && fieldValue > filterExpr.value;
      case '<':
        return typeof fieldValue === 'number' && typeof filterExpr.value === 'number' && fieldValue < filterExpr.value;
      case '>=':
        return typeof fieldValue === 'number' && typeof filterExpr.value === 'number' && fieldValue >= filterExpr.value;
      case '<=':
        return typeof fieldValue === 'number' && typeof filterExpr.value === 'number' && fieldValue <= filterExpr.value;
      case 'contains':
        return typeof fieldValue === 'string' && typeof filterExpr.value === 'string' && fieldValue.includes(filterExpr.value as string);
      case 'startsWith':
        return typeof fieldValue === 'string' && typeof filterExpr.value === 'string' && fieldValue.startsWith(filterExpr.value as string);
      case 'truthy':
        return !!fieldValue;
      default:
        return false;
    }
  });
}

function resolveField(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
