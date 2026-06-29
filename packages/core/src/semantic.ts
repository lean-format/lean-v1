export interface SemanticWarning {
  type: 'type-inconsistency' | 'empty-value' | 'trailing-comma' | 'suspicious-ref' | 'mixed-indent';
  path: string;
  message: string;
  suggestion?: string;
}

export interface SemanticResult {
  warnings: SemanticWarning[];
}

function getTypeString(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function stripArrayIndices(p: string): string {
  return p.replace(/\[\d+\]/g, '[]');
}

function walkValue(
  value: unknown,
  path: string,
  warnings: SemanticWarning[],
  seenTypes: Map<string, Set<string>>,
): void {
  if (value === null || value === undefined) {
    warnings.push({
      type: 'empty-value',
      path,
      message: `Empty value at '${path}'`,
      suggestion: 'Consider providing a value or removing the key entirely.',
    });
    return;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      const normalizedPath = stripArrayIndices(childPath);

      if (!seenTypes.has(normalizedPath)) {
        seenTypes.set(normalizedPath, new Set());
      }
      const types = seenTypes.get(normalizedPath)!;
      const vt = getTypeString(val);
      types.add(vt);

      if (types.size > 1) {
        if (!warnings.some(w => stripArrayIndices(w.path) === normalizedPath && w.type === 'type-inconsistency')) {
          warnings.push({
            type: 'type-inconsistency',
            path: childPath,
            message: `'${normalizedPath}' has inconsistent types: ${[...types].join(', ')}`,
            suggestion: 'Ensure all values for this key have the same type.',
          });
        }
      }

      if (key === '$ref' && typeof val === 'string') {
        if (!val.startsWith('$') && !val.startsWith('.')) {
          warnings.push({
            type: 'suspicious-ref',
            path: childPath,
            message: `Suspicious reference value: '${val}'`,
            suggestion: 'References typically start with "$" or use dot-notation paths.',
          });
        }
      }

      walkValue(val, childPath, warnings, seenTypes);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      walkValue(value[i], `${path}[${i}]`, warnings, seenTypes);
    }
    return;
  }
}

export function analyze(input: string, parsed: unknown): SemanticResult {
  const warnings: SemanticWarning[] = [];
  const seenTypes: Map<string, Set<string>> = new Map();

  const lines = input.split('\n');
  const trailingCommaLines: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.endsWith(',') && !trimmed.endsWith('\\,')) {
      trailingCommaLines.push(i + 1);
    }
  }
  for (const lineNum of trailingCommaLines) {
    warnings.push({
      type: 'trailing-comma',
      path: `line ${lineNum}`,
      message: `Trailing comma on line ${lineNum}`,
      suggestion: 'Remove the trailing comma — LEAN does not require commas as separators.',
    });
  }

  const indentChars = new Set<string>();
  for (const line of lines) {
    if (line.length === 0) continue;
    const first = line[0];
    if (first === ' ' || first === '\t') {
      indentChars.add(first);
    }
  }
  if (indentChars.size > 1) {
    warnings.push({
      type: 'mixed-indent',
      path: 'document',
      message: 'Mixed spaces and tabs used for indentation',
      suggestion: 'Pick one indentation style and use it consistently (spaces recommended).',
    });
  }

  walkValue(parsed, '', warnings, seenTypes);

  return { warnings };
}

export function hasWarnings(result: SemanticResult): boolean {
  return result.warnings.length > 0;
}

export function formatWarnings(result: SemanticResult, _colors: boolean = true): string {
  if (result.warnings.length === 0) return '';
  const lines: string[] = [];
  for (const w of result.warnings) {
    const label = w.type;
    const location = w.path ? `[${w.path}]` : '';
    lines.push(`  ${label}${location}: ${w.message}`);
    if (w.suggestion) {
      lines.push(`    Suggestion: ${w.suggestion}`);
    }
  }
  return lines.join('\n');
}
