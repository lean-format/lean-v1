import type { DiffEntry } from './types.js';

/**
 * Compute a structural diff between two parsed LEAN data objects.
 * Recursively compares two values and returns a list of differences.
 *
 * @param a - First data object (the "old" version)
 * @param b - Second data object (the "new" version)
 * @param basePath - Internal use for recursion
 * @returns Array of diff entries describing what changed
 *
 * @example
 * const old = parse(`name: Alice\nage: 30\n`);
 * const updated = parse(`name: Alice\nage: 31\ncity: Boston\n`);
 * diff(old, updated)
 * // [
 * //   { type: 'changed', path: 'age', oldValue: 30, newValue: 31 },
 * //   { type: 'added', path: 'city', newValue: 'Boston' }
 * // ]
 */
export function diff(a: unknown, b: unknown, basePath = ''): DiffEntry[] {
  const changes: DiffEntry[] = [];

  if (a === b) return changes;

  // Both are null/undefined
  if (a == null && b == null) return changes;

  // One is null/undefined, the other isn't
  if (a == null || b == null) {
    changes.push({
      type: 'changed',
      path: basePath || '(root)',
      oldValue: a,
      newValue: b,
    });
    return changes;
  }

  // Different types
  if (typeof a !== typeof b) {
    changes.push({
      type: 'changed',
      path: basePath || '(root)',
      oldValue: a,
      newValue: b,
    });
    return changes;
  }

  // Both are primitives
  if (typeof a !== 'object') {
    if (a !== b) {
      changes.push({
        type: 'changed',
        path: basePath || '(root)',
        oldValue: a,
        newValue: b,
      });
    }
    return changes;
  }

  // Both are arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = basePath ? `${basePath}[${i}]` : `[${i}]`;
      if (i >= a.length) {
        changes.push({ type: 'added', path: itemPath, newValue: b[i] });
      } else if (i >= b.length) {
        changes.push({ type: 'removed', path: itemPath, oldValue: a[i] });
      } else {
        changes.push(...diff(a[i], b[i], itemPath));
      }
    }
    return changes;
  }

  // Both are objects (and not arrays)
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

    for (const key of allKeys) {
      const keyPath = basePath ? `${basePath}.${key}` : key;
      if (!(key in objA)) {
        changes.push({ type: 'added', path: keyPath, newValue: objB[key] });
      } else if (!(key in objB)) {
        changes.push({ type: 'removed', path: keyPath, oldValue: objA[key] });
      } else {
        changes.push(...diff(objA[key], objB[key], keyPath));
      }
    }
    return changes;
  }

  // Fallback: different types or array vs object
  changes.push({
    type: 'changed',
    path: basePath || '(root)',
    oldValue: a,
    newValue: b,
  });

  return changes;
}

/**
 * Pretty-print a diff result as a human-readable string.
 *
 * @param entries - Diff entries
 * @returns Formatted diff string
 */
export function formatDiff(entries: DiffEntry[]): string {
  if (entries.length === 0) return 'No differences found.';

  const lines: string[] = [];
  for (const entry of entries) {
    switch (entry.type) {
      case 'added':
        lines.push(`  + ${entry.path}: ${JSON.stringify(entry.newValue)}`);
        break;
      case 'removed':
        lines.push(`  - ${entry.path}: ${JSON.stringify(entry.oldValue)}`);
        break;
      case 'changed':
        lines.push(`  ~ ${entry.path}:`);
        lines.push(`      - ${JSON.stringify(entry.oldValue)}`);
        lines.push(`      + ${JSON.stringify(entry.newValue)}`);
        break;
    }
  }
  return lines.join('\n');
}
