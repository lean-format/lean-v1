import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { validate, initParser } from '@lean-format/core';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Initialize WASM parser on startup
initParser().catch(() => {
  connection.console.log('WASM parser unavailable, using JS fallback');
});

connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
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

documents.listen(connection);
connection.listen();
