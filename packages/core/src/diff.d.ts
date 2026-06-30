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
export declare function diff(a: unknown, b: unknown, basePath?: string): DiffEntry[];
/**
 * Pretty-print a diff result as a human-readable string.
 *
 * @param entries - Diff entries
 * @returns Formatted diff string
 */
export declare function formatDiff(entries: DiffEntry[]): string;
//# sourceMappingURL=diff.d.ts.map