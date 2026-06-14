import * as vscode from 'vscode';
import { parse, format, validate, initParser } from '@lean-format/core';

export function activate(context: vscode.ExtensionContext) {
  console.log('LEAN format extension is now active');

  // Initialize parser (prefer WASM, fall back to JS)
  initParser().catch(() => {
    console.log('WASM parser unavailable, using JS fallback');
  });

  // ── Document formatting ──────────────────────────────────────────
  const formatProvider = vscode.languages.registerDocumentFormattingEditProvider('lean', {
    provideDocumentFormattingEdits(document: vscode.TextDocument) {
      try {
        const text = document.getText();
        const cfg = vscode.workspace.getConfiguration('lean');
        const parsed = parse(text);
        const indentSize = cfg.get('format.indentSize', 2);
        const formatted = format(parsed, {
          indent: ' '.repeat(indentSize),
          useRowSyntax: cfg.get('format.useRowSyntax', true),
          rowThreshold: cfg.get('format.rowThreshold', 4),
          sortKeys: cfg.get('format.sortKeys', false),
          useDotNotation: cfg.get('format.useDotNotation', false),
        });

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length),
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
      } catch (error: any) {
        vscode.window.showErrorMessage(`LEAN format error: ${error.message}`);
        return [];
      }
    },
  });

  // ── Validate command ─────────────────────────────────────────────
  const validateCmd = vscode.commands.registerCommand('lean.validate', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const document = editor.document;
    if (document.languageId !== 'lean') {
      vscode.window.showWarningMessage('This command only works with LEAN files');
      return;
    }

    try {
      const text = document.getText();
      const result = validate(text);

      if (result.valid) {
        vscode.window.showInformationMessage('✓ LEAN file is valid');
      } else {
        const msgs = result.errors.map(e =>
          `Line ${e.line}${e.column ? `:${e.column}` : ''}: ${e.message}${e.suggestion ? `\n  Suggestion: ${e.suggestion}` : ''}`
        ).join('\n');
        vscode.window.showErrorMessage(`Validation errors:\n${msgs}`);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Validation error: ${error.message}`);
    }
  });

  // ── Convert to JSON command ──────────────────────────────────────
  const convertCmd = vscode.commands.registerCommand('lean.convertToJson', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const document = editor.document;
    if (document.languageId !== 'lean') {
      vscode.window.showWarningMessage('This command only works with LEAN files');
      return;
    }

    try {
      const text = document.getText();
      const result = parse(text);
      const json = JSON.stringify(result, null, 2);

      const jsonDoc = await vscode.workspace.openTextDocument({
        language: 'json',
        content: json,
      });
      await vscode.window.showTextDocument(jsonDoc);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Conversion error: ${error.message}`);
    }
  });

  // ── Real-time diagnostics ────────────────────────────────────────
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('lean');
  context.subscriptions.push(diagnosticCollection);

  function validateDocument(document: vscode.TextDocument) {
    if (document.languageId !== 'lean') return;

    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const result = validate(text);
      if (!result.valid) {
        for (const err of result.errors) {
          const line = err.line ? Math.max(0, err.line - 1) : 0;
          let range: vscode.Range;
          try {
            const lineText = document.lineAt(line);
            range = new vscode.Range(line, 0, line, lineText.text.length);
          } catch {
            range = new vscode.Range(line, 0, line, 1);
          }

          const diagnostic = new vscode.Diagnostic(
            range,
            err.message + (err.suggestion ? ` (${err.suggestion})` : ''),
            vscode.DiagnosticSeverity.Error,
          );
          diagnostics.push(diagnostic);
        }
      }
    } catch (error: any) {
      const match = error.message.match(/line (\d+)/i);
      const line = match ? Math.max(0, parseInt(match[1]) - 1) : 0;
      let range: vscode.Range;
      try {
        const lineText = document.lineAt(line);
        range = new vscode.Range(line, 0, line, lineText.text.length);
      } catch {
        range = new vscode.Range(0, 0, 0, 1);
      }
      diagnostics.push(new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error));
    }

    diagnosticCollection.set(document.uri, diagnostics);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(validateDocument),
    vscode.workspace.onDidChangeTextDocument(e => validateDocument(e.document)),
    vscode.workspace.onDidCloseTextDocument(doc => diagnosticCollection.delete(doc.uri)),
  );

  // Initial validation of open documents
  for (const doc of vscode.workspace.textDocuments) {
    validateDocument(doc);
  }

  context.subscriptions.push(formatProvider, validateCmd, convertCmd);
}

export function deactivate() {}
