import { parse, JsLeanParser } from './js-parser.js';
import { type ParseOptions } from './types.js';

function findCommonPrefix(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return i;
  }
  return len;
}

function findCommonSuffix(a: string, b: string, max: number): number {
  const aLen = a.length;
  const bLen = b.length;
  const limit = Math.min(max, aLen, bLen);
  for (let i = 0; i < limit; i++) {
    if (a[aLen - 1 - i] !== b[bLen - 1 - i]) return i;
  }
  return limit;
}

function findTopLevelBlockOffsets(text: string): { key: string; startOffset: number; endOffset: number }[] {
  const blocks: { key: string; startOffset: number; endOffset: number }[] = [];
  const lines = text.split('\n');
  let currentKey = '';
  let currentStart = 0;
  let currentEnd = 0;
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const leadingSpace = line.length - line.trimStart().length;

    if (leadingSpace === 0 && line.trim().length > 0 && !line.trim().startsWith('#') && !line.trim().startsWith('-')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && !line.includes('(')) {
        const possibleKey = line.slice(0, colonIdx).trim();
        if (possibleKey.length > 0 && /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(possibleKey)) {
          if (inBlock) {
            const endOffset = text.indexOf('\n', currentEnd);
            blocks.push({ key: currentKey, startOffset: currentStart, endOffset: endOffset >= 0 ? endOffset : text.length });
          }
          currentKey = possibleKey;
          currentStart = text.indexOf(line, currentEnd);
          currentEnd = currentStart + line.length;
          inBlock = true;
          continue;
        }
      }
    }

    if (inBlock) {
      const lineStart = text.indexOf(line, currentEnd);
      if (lineStart >= 0) {
        currentEnd = lineStart + line.length;
      }
    }
  }

  if (inBlock) {
    blocks.push({ key: currentKey, startOffset: currentStart, endOffset: text.length });
  }

  return blocks;
}

export class IncrementalParser {
  private prevText: string;
  private prevResult: Record<string, unknown>;
  private _options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.prevText = '';
    this.prevResult = {};
    this._options = options;
  }

  parse(fullText: string): Record<string, unknown> {
    if (this.prevText === fullText) {
      return this.prevResult;
    }

    if (!this.prevText) {
      const result = parse(fullText, this._options) as Record<string, unknown>;
      this.prevText = fullText;
      this.prevResult = result;
      return result;
    }

    const result = this.incrementalUpdate(fullText);
    this.prevText = fullText;
    this.prevResult = result;
    return result;
  }

  private incrementalUpdate(newText: string): Record<string, unknown> {
    const prefixLen = findCommonPrefix(this.prevText, newText);
    const maxSuffix = Math.min(this.prevText.length - prefixLen, newText.length - prefixLen);
    const suffixLen = findCommonSuffix(
      this.prevText.slice(prefixLen),
      newText.slice(prefixLen),
      maxSuffix,
    );

    const changedStart = prefixLen;
    const changedEnd = newText.length - suffixLen;

    const oldBlocks = findTopLevelBlockOffsets(this.prevText);
    const newBlocks = findTopLevelBlockOffsets(newText);

    const affectedKeys = new Set<string>();

    for (const block of oldBlocks) {
      if (block.startOffset <= changedStart && block.endOffset >= prefixLen) {
        affectedKeys.add(block.key);
      } else if (block.startOffset >= prefixLen && block.startOffset <= this.prevText.length - suffixLen) {
        affectedKeys.add(block.key);
      }
    }

    for (const block of newBlocks) {
      if (block.startOffset <= changedEnd && block.endOffset >= changedStart) {
        affectedKeys.add(block.key);
      }
    }

    if (affectedKeys.size === 0) {
      return this.prevResult;
    }

    const parser = new JsLeanParser(this._options.strict ?? false, this._options);
    const partialText = this.extractPartialText(newText, newBlocks, affectedKeys);
    const partialResult = parser.parse(partialText) as Record<string, unknown>;

    const merged: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(this.prevResult)) {
      if (!affectedKeys.has(key)) {
        merged[key] = value;
      }
    }
    for (const [key, value] of Object.entries(partialResult)) {
      merged[key] = value;
    }

    return merged;
  }

  private extractPartialText(fullText: string, blocks: { key: string; startOffset: number; endOffset: number }[], keys: Set<string>): string {
    const lines: string[] = [];
    for (const block of blocks) {
      if (keys.has(block.key)) {
        lines.push(fullText.slice(block.startOffset, block.endOffset));
      }
    }
    return lines.join('\n');
  }

  reset(): void {
    this.prevText = '';
    this.prevResult = {};
  }

  get prevTextLen(): number {
    return this.prevText.length;
  }
}

export function parseIncremental(
  input: string,
  _options: ParseOptions = {},
  parser?: IncrementalParser,
): Record<string, unknown> {
  if (!parser) parser = defaultIncrementalParser;
  return parser.parse(input);
}

export const defaultIncrementalParser = new IncrementalParser();
