import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  MarkupContent,
  MarkupKind,
  CompletionItem,
  CompletionItemKind,
  DocumentSymbol,
  SymbolKind,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { validate, initParser } from '@lean-format/core';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Initialize WASM parser on startup
initParser().catch(() => {
  connection.console.log('WASM parser unavailable, using JS fallback');
});

connection.onInitialize((_params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [],
      },
      documentSymbolProvider: true,
    },
  };
  return result;
});

documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  const result = validate(text, { strict: true });

  if (!result.valid) {
    for (const err of result.errors) {
      const line = err.line ? Math.max(0, err.line - 1) : 0;
      let range = {
        start: { line, character: 0 },
        end: { line, character: Number.MAX_SAFE_INTEGER },
      };

      if (err.column) {
        try {
          const lineText = textDocument.getText({
            start: { line, character: 0 },
            end: { line, character: Number.MAX_SAFE_INTEGER },
          });
          range = {
            start: { line, character: Math.max(0, err.column - 1) },
            end: { line, character: lineText.length },
          };
        } catch {
          // fall back to full line
        }
      }

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range,
        message: err.message + (err.suggestion ? ` (${err.suggestion})` : ''),
        source: 'lean',
      };
      diagnostics.push(diagnostic);
    }
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// ----- Provider helpers -----

interface KeyInfo {
  name: string;
  line: number;
  indent: number;
}

function extractKeys(text: string): KeyInfo[] {
  const keys: KeyInfo[] = [];
  const lines = text.split('\n');
  const keyRegex = /^(\s*)([a-zA-Z_$][a-zA-Z0-9_$.-]*)\s*:/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(keyRegex);
    if (match) {
      keys.push({
        name: match[2],
        line: i,
        indent: match[1].length,
      });
    }
  }

  return keys;
}

// ----- Hover provider -----

connection.onHover((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const text = document.getText();
  const lines = text.split('\n');
  const lineIdx = params.position.line;

  if (lineIdx >= lines.length) return null;

  const lineText = lines[lineIdx];
  const match = lineText.match(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$.-]*)\s*:/);

  if (match) {
    const keyName = match[2];
    const keyStart = match[1].length;
    const keyEnd = keyStart + keyName.length;

    if (params.position.character >= keyStart && params.position.character <= keyEnd) {
      const contents: MarkupContent = {
        kind: MarkupKind.Markdown,
        value: `**${keyName}**\n\nLEAN key`,
      };
      return { contents };
    }
  }

  return null;
});

// ----- Completion provider -----

connection.onCompletion((params) => {
  const completions: CompletionItem[] = [
    { label: 'true', kind: CompletionItemKind.Keyword },
    { label: 'false', kind: CompletionItemKind.Keyword },
    { label: 'null', kind: CompletionItemKind.Keyword },
  ];

  const document = documents.get(params.textDocument.uri);
  if (document) {
    const keys = extractKeys(document.getText());
    const seen = new Set<string>();
    for (const key of keys) {
      if (!seen.has(key.name)) {
        seen.add(key.name);
        completions.push({
          label: key.name,
          kind: CompletionItemKind.Property,
        });
      }
    }
  }

  return completions;
});

// ----- Document symbols provider -----

connection.onDocumentSymbol((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const keys = extractKeys(document.getText());
  const symbols: DocumentSymbol[] = [];

  for (const key of keys) {
    if (key.indent === 0) {
      symbols.push({
        name: key.name,
        kind: SymbolKind.Property,
        range: {
          start: { line: key.line, character: 0 },
          end: { line: key.line, character: Number.MAX_SAFE_INTEGER },
        },
        selectionRange: {
          start: { line: key.line, character: 0 },
          end: { line: key.line, character: Number.MAX_SAFE_INTEGER },
        },
      });
    }
  }

  return symbols;
});

documents.listen(connection);
connection.listen();
