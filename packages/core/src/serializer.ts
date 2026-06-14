import { LeanSerializeError } from './errors.js';
import type { FormatOptions } from './types.js';

const DEFAULT_INDENT = '  ';
const DEFAULT_ROW_THRESHOLD = 4; // Per spec §9.2: > 3 items → row syntax

/**
 * Serialize a JavaScript object to LEAN format text.
 *
 * @param obj - JavaScript object to serialize
 * @param options - Serialization options
 * @returns LEAN format text
 * @throws {LeanSerializeError} If serialization fails
 */
export function format(obj: unknown, options: FormatOptions = {}): string {
  const indent = options.indent ?? DEFAULT_INDENT;
  const useRowSyntax = options.useRowSyntax ?? true;
  const rowThreshold = options.rowThreshold ?? DEFAULT_ROW_THRESHOLD;
  const useDotNotation = options.useDotNotation ?? false;
  const sortKeys = options.sortKeys ?? false;

  if (useDotNotation) {
    console.warn(
      '[LEAN Warning] useDotNotation is enabled. This may break round-trip serialization: parse(format(data, { useDotNotation: true })) may not equal data. Use with caution.',
    );
  }

  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new LeanSerializeError('Root value must be a non-null object');
  }

  function isPrimitive(v: unknown): v is string | number | boolean | null | undefined {
    return v === null || v === undefined || typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string';
  }

  function needsQuotes(str: string): boolean {
    if (/[\s,:[\]{}#@!/+=&|<>?;'`~^%]/.test(str)) return true;
    if (/^[0-9-]/.test(str)) return true;
    if (str === 'true' || str === 'false' || str === 'null') return true;
    if (str === '') return true;
    return false;
  }

  function quoteString(str: string): string {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
  }

  function toLeanValue(value: unknown, level: number): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        throw new LeanSerializeError(`Cannot serialize ${value}`);
      }
      return value.toString();
    }
    if (typeof value === 'string') {
      return needsQuotes(value) ? quoteString(value) : value;
    }
    if (Array.isArray(value)) return toLeanArray(value, level);
    if (typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>);
      if (keys.length === 0) return ' {}';
      return `\n${toLeanObject(value as Record<string, unknown>, level + 1)}`;
    }
    return 'null';
  }

  function toLeanArray(arr: unknown[], level: number): string {
    if (arr.length === 0) return ' []';

    const prefix = indent.repeat(level + 1);
    const isArrayOfObjects = arr.every(
      (item) => typeof item === 'object' && item !== null && !Array.isArray(item),
    );

    // Row syntax: uniform arrays of primitives-only objects
    if (useRowSyntax && isArrayOfObjects && arr.length >= rowThreshold) {
      const keys = getKeys(arr as Record<string, unknown>[]);
      const isUniform = arr.every((item) => {
        const itemKeys = Object.keys(item as Record<string, unknown>);
        return itemKeys.length === keys.length && keys.every((k) => itemKeys.includes(k));
      });
      const allFlat = arr.every((item) =>
        Object.values(item as Record<string, unknown>).every((v) => isPrimitive(v)),
      );

      if (isUniform && keys.length > 0 && allFlat) {
        let result = '\n';
        for (const item of arr) {
          const values = keys.map((k) => toLeanValue((item as Record<string, unknown>)[k], level + 1));
          result += `${prefix}- ${values.join(', ')}\n`;
        }
        return result;
      }
    }

    // Standard object list or primitive list
    let result = '\n';
    for (const item of arr) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        result += `${prefix}-\n`;
        result += toLeanObject(item as Record<string, unknown>, level + 2);
      } else {
        result += `${prefix}- ${toLeanValue(item, level + 1)}\n`;
      }
    }
    return result;
  }

  function toLeanObject(
    obj: Record<string, unknown>,
    level: number,
  ): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return ' {}';

    if (sortKeys) {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }

    const prefix = indent.repeat(level);
    let result = '';

    for (const [key, value] of entries) {
      // Use dot-notation only if explicitly enabled
      if (useDotNotation && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result += serializeDotNotation(obj, prefix, indent, useRowSyntax, rowThreshold, toLeanValue, level);
        break; // serializeDotNotation handles all keys
      }

      // Row syntax for arrays at this level
      if (Array.isArray(value) && value.length > 0) {
        const isArrayOfObjects = value.every(
          (item) => typeof item === 'object' && item !== null && !Array.isArray(item),
        );

        if (useRowSyntax && isArrayOfObjects && value.length >= rowThreshold) {
          const keys = getKeys(value as Record<string, unknown>[]);
          const isUniform = value.every((item) => {
            const itemKeys = Object.keys(item as Record<string, unknown>);
            return itemKeys.length === keys.length && keys.every((k) => itemKeys.includes(k));
          });
          const allFlat = value.every((item) =>
            Object.values(item as Record<string, unknown>).every((v) => isPrimitive(v)),
          );

          if (isUniform && keys.length > 0 && allFlat) {
            result += `${prefix}${key}(${keys.join(', ')}):\n`;
            for (const item of value) {
              const values = keys.map((k) => toLeanValue((item as Record<string, unknown>)[k], level + 1));
              result += `${indent.repeat(level + 1)}- ${values.join(', ')}\n`;
            }
            continue;
          }
        }
      }

      const valueStr = toLeanValue(value, level);
      if (valueStr.startsWith('\n') || valueStr.startsWith(' []') || valueStr.startsWith(' {}')) {
        result += `${prefix}${key}:${valueStr}`;
      } else {
        result += `${prefix}${key}: ${valueStr}\n`;
      }
    }

    return result;
  }

  function serializeDotNotation(
    obj: Record<string, unknown>,
    prefix: string,
    _indent: string,
    _useRowSyntax: boolean,
    _rowThreshold: number,
    _toLeanValue: (v: unknown, l: number) => string,
    level: number = 0,
  ): string {
    const flat = flattenObject(obj);
    const sortedEntries = sortKeys
      ? Object.entries(flat).sort(([a], [b]) => a.localeCompare(b))
      : Object.entries(flat);

    let result = '';
    const indentStr = prefix || _indent.repeat(level);
    for (const [key, value] of sortedEntries) {
      if (Array.isArray(value) && value.length > 0) {
        result += `${indentStr}${key}:${_toLeanValue(value, level)}\n`;
      } else {
        result += `${indentStr}${key}: ${_toLeanValue(value, level)}\n`;
      }
    }
    return result;
  }

  function flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value as Record<string, unknown>, prefixedKey));
      } else {
        result[prefixedKey] = value;
      }
    }
    return result;
  }

  function getKeys(arr: Record<string, unknown>[]): string[] {
    const keySet = new Set<string>();
    for (const item of arr) {
      for (const key of Object.keys(item)) {
        keySet.add(key);
      }
    }
    const keys = Array.from(keySet);
    return sortKeys ? keys.sort() : keys;
  }

  return toLeanObject(obj as Record<string, unknown>, 0);
}
