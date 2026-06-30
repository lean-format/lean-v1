import { ASTNode, ASTNodeType, ParseError, ParseOptions, ParseResult, Position, SourceLocation, ValidationResult } from './types';

type ParserToken = {
  type: string;
  value: string;
  loc: SourceLocation;
};

const BLOCK_KEYWORDS = ['model', 'enum', 'relation', 'constraint', 'type', 'doc'] as const;
function makePos(line: number, column: number, offset: number): Position {
  return { line, column, offset };
}

function makeLoc(start: Position, end: Position): SourceLocation {
  return { start, end };
}

function isBlockKeyword(word: string): boolean {
  return (BLOCK_KEYWORDS as readonly string[]).includes(word);
}

function tokenize(source: string): ParserToken[] {
  const tokens: ParserToken[] = [];
  const lines = source.split('\n');
  let offset = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let col = 0;

    while (col < line.length) {
      const startOffset = offset + col;

      if (line[col] === ' ' || line[col] === '\t') {
        col++;
        continue;
      }

      if (line[col] === '/' && line[col + 1] === '/') {
        const comment = line.slice(col);
        tokens.push({
          type: 'comment',
          value: comment,
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, line.length, offset + line.length)
          ),
        });
        break;
      }

      if (line[col] === '/' && line[col + 1] === '*') {
        const endIdx = line.indexOf('*/', col + 2);
        if (endIdx !== -1) {
          const comment = line.slice(col, endIdx + 2);
          tokens.push({
            type: 'comment',
            value: comment,
            loc: makeLoc(
              makePos(lineIdx + 1, col + 1, startOffset),
              makePos(lineIdx + 1, endIdx + 2, startOffset + comment.length)
            ),
          });
          col = endIdx + 2;
          continue;
        }
        // multi-line block comment — take rest of line
        const comment = line.slice(col);
        tokens.push({
          type: 'comment',
          value: comment,
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, line.length, offset + line.length)
          ),
        });
        break;
      }

      if (line[col] === '"' || line[col] === "'") {
        const quote = line[col];
        let end = col + 1;
        while (end < line.length && line[end] !== quote) {
          if (line[end] === '\\') end++;
          end++;
        }
        if (end < line.length) end++;
        const str = line.slice(col, end);
        tokens.push({
          type: 'string',
          value: str,
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, end, startOffset + str.length)
          ),
        });
        col = end;
        continue;
      }

      const arrowMatch = line.slice(col).match(/^(<->|->[\?\*1n]?|<-[\?]?)/);
      if (arrowMatch) {
        const arrow = arrowMatch[1];
        tokens.push({
          type: 'arrow',
          value: arrow,
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, col + arrow.length, startOffset + arrow.length)
          ),
        });
        col += arrow.length;
        continue;
      }

      if (/[{}()\[\],:]/.test(line[col])) {
        tokens.push({
          type: 'punctuation',
          value: line[col],
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, col + 2, startOffset + 1)
          ),
        });
        col++;
        continue;
      }

      const wordMatch = line.slice(col).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        tokens.push({
          type: isBlockKeyword(word) ? 'keyword' : 'identifier',
          value: word,
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, col + word.length, startOffset + word.length)
          ),
        });
        col += word.length;
        continue;
      }

      const numMatch = line.slice(col).match(/^\d+(\.\d+)?/);
      if (numMatch) {
        const num = numMatch[0];
        tokens.push({
          type: 'number',
          value: num,
          loc: makeLoc(
            makePos(lineIdx + 1, col + 1, startOffset),
            makePos(lineIdx + 1, col + num.length, startOffset + num.length)
          ),
        });
        col += num.length;
        continue;
      }

      col++;
    }

    offset += line.length + 1;
  }

  return tokens;
}

function parseBlock(tokens: ParserToken[], idx: number): { node: ASTNode; nextIdx: number; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const keywordToken = tokens[idx];
  const blockType = keywordToken.value as ASTNodeType;
  let pos = idx + 1;

  let name: string | undefined;
  if (pos < tokens.length && tokens[pos].type === 'identifier') {
    name = tokens[pos].value;
    pos++;
  }

  let children: ASTNode[] = [];
  let attributes: Record<string, string | number | boolean> = {};

  if (pos < tokens.length && tokens[pos].value === '{') {
    pos++;
    while (pos < tokens.length) {
      const t = tokens[pos];
      if (t.value === '}') {
        pos++;
        break;
      }
      if ((BLOCK_KEYWORDS as readonly string[]).includes(t.value as typeof BLOCK_KEYWORDS[number])) {
        const result = parseBlock(tokens, pos);
        children.push(result.node);
        errors.push(...result.errors);
        pos = result.nextIdx;
      } else if (t.type === 'identifier') {
        const fieldName = t.value;
        pos++;
        let fieldValue: string | number | boolean | undefined;
        if (pos < tokens.length && tokens[pos].value === ':') {
          pos++;
          if (pos < tokens.length) {
            if (tokens[pos].type === 'string' || tokens[pos].type === 'number' || tokens[pos].type === 'identifier') {
              fieldValue = tokens[pos].value;
              if (tokens[pos].type === 'number') {
                fieldValue = parseFloat(tokens[pos].value);
              }
              pos++;
            }
            if (pos < tokens.length && tokens[pos].value === ',') pos++;
          }
        }
        children.push({
          type: 'field',
          name: fieldName,
          value: fieldValue,
          loc: makeLoc(t.loc.start, pos > idx ? tokens[pos - 1].loc.end : t.loc.end),
        });
      } else if (t.type === 'comment') {
        pos++;
      } else {
        pos++;
      }
    }
  }

  const node: ASTNode = {
    type: blockType,
    name,
    children: children.length > 0 ? children : undefined,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    loc: makeLoc(keywordToken.loc.start, pos > 0 ? tokens[pos - 1].loc.end : keywordToken.loc.end),
  };

  return { node, nextIdx: pos, errors };
}

export function parse(source: string, _options?: ParseOptions): ParseResult {
  const errors: ParseError[] = [];
  const tokens = tokenize(source);

  const ast: ASTNode[] = [];
  let idx = 0;
  while (idx < tokens.length) {
    const t = tokens[idx];
    if (t.type === 'comment') {
      idx++;
      continue;
    }
    if (t.type === 'keyword' && isBlockKeyword(t.value)) {
      const result = parseBlock(tokens, idx);
      ast.push(result.node);
      errors.push(...result.errors);
      idx = result.nextIdx;
    } else {
      const line = t.loc.start.line;
      const col = t.loc.start.column;
      const context = source.split('\n')[line - 1]?.trim() ?? '';
      errors.push({
        message: `Unexpected token '${t.value}' at ${line}:${col} in "${context}"`,
        loc: t.loc,
        severity: 'error',
      });
      idx++;
    }
  }

  return {
    success: errors.length === 0,
    ast,
    errors,
    source,
  };
}

export function validate(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];
  const parseResult = parse(source);

  if (!parseResult.success) {
    for (const err of parseResult.errors) {
      results.push({
        message: err.message,
        loc: err.loc,
        severity: 'error',
        code: 'PARSE_ERROR',
      });
    }
    return results;
  }

  const modelNames = new Map<string, ASTNode>();
  const enumNames = new Map<string, ASTNode>();

  for (const node of parseResult.ast) {
    if (node.type === 'model' && node.name) {
      if (modelNames.has(node.name)) {
        results.push({
          message: `Duplicate model name '${node.name}'`,
          loc: node.loc,
          severity: 'error',
          code: 'DUPLICATE_MODEL',
        });
      } else {
        modelNames.set(node.name, node);
      }
    }
    if (node.type === 'enum' && node.name) {
      if (enumNames.has(node.name)) {
        results.push({
          message: `Duplicate enum name '${node.name}'`,
          loc: node.loc,
          severity: 'error',
          code: 'DUPLICATE_ENUM',
        });
      } else {
        enumNames.set(node.name, node);
      }
    }
  }

  for (const node of parseResult.ast) {
    if (node.type === 'relation' && node.name && node.children) {
      const parts = node.name.split(/->|<-|<->/);
      for (const part of parts) {
        const ref = part.trim().split(/[^a-zA-Z0-9_]/)[0];
        if (ref && ref !== node.name && !modelNames.has(ref)) {
          results.push({
            message: `Relation '${node.name}' references unknown model '${ref}'`,
            loc: node.loc,
            severity: 'warning',
            code: 'MISSING_MODEL_REF',
          });
        }
      }
    }

    if (node.type === 'model' && node.children) {
      for (const child of node.children) {
        if (child.type === 'field' && child.value && typeof child.value === 'string') {
          const refMatch = child.value.match(/^[A-Z][a-zA-Z0-9]*$/);
          if (refMatch && !modelNames.has(child.value) && !enumNames.has(child.value)) {
            results.push({
              message: `Field '${child.name}' in model '${node.name}' references unknown type '${child.value}'`,
              loc: child.loc,
              severity: 'warning',
              code: 'MISSING_TYPE_REF',
            });
          }
        }
      }
    }
  }

  const visited = new Set<string>();
  function detectCycle(name: string, stack: Set<string>): boolean {
    if (stack.has(name)) return true;
    if (visited.has(name)) return false;
    const node = modelNames.get(name);
    if (!node || !node.children) return false;
    stack.add(name);
    visited.add(name);
    for (const child of node.children) {
      if (child.type === 'field' && child.value && typeof child.value === 'string') {
        if (modelNames.has(child.value)) {
          if (detectCycle(child.value, stack)) {
            results.push({
              message: `Circular dependency detected involving model '${name}' -> '${child.value}'`,
              loc: child.loc,
              severity: 'error',
              code: 'CIRCULAR_DEPENDENCY',
            });
            stack.delete(name);
            return true;
          }
        }
      }
    }
    stack.delete(name);
    return false;
  }

  for (const name of modelNames.keys()) {
    detectCycle(name, new Set());
  }

  return results;
}

function formatNode(node: ASTNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);
  let result = '';

  if (node.type === 'doc') {
    result = `doc:\n`;
    if (node.value) {
      result += `${padInner}${node.value}\n`;
    }
    return result;
  }

  result = `${pad}${node.type}`;
  if (node.name) {
    result += ` ${node.name}`;
  }

  if (node.children && node.children.length > 0) {
    result += ' {\n';
    for (const child of node.children) {
      if (child.type === 'field') {
        result += `${padInner}${child.name}`;
        if (child.value !== undefined) {
          result += `: ${typeof child.value === 'string' ? `"${child.value}"` : child.value}`;
        }
        result += '\n';
      } else {
        result += formatNode(child, indent + 1);
      }
    }
    result += `${pad}}\n`;
  } else {
    result += '\n';
  }

  return result;
}

export function format(source: string): string {
  const parseResult = parse(source);
  if (!parseResult.success) {
    return source;
  }
  return parseResult.ast.map((node) => formatNode(node)).join('\n');
}

export async function parseWasm(source: string): Promise<ParseResult> {
  return parse(source);
}
