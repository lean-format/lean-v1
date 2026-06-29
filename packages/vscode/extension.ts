import * as vscode from 'vscode';
import { parse, format } from '@lean-format/core';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  // ── LSP Client ────────────────────────────────────────────────────
  const serverModule = context.asAbsolutePath('../lean-language-server/dist/server.js');
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--inspect=6009', '--experimental-wasm-modules'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'lean' }],
    synchronize: {
      configurationSection: 'lean',
    },
  };

  client = new LanguageClient('lean', 'LEAN Language Server', serverOptions, clientOptions);
  client.start();

  // ── Document Formatting (direct API — faster than LSP round-trip) ─
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
        });

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length),
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
      } catch {
        return [];
      }
    },
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
      const json = JSON.stringify(parse(text), null, 2);
      const jsonDoc = await vscode.workspace.openTextDocument({
        language: 'json',
        content: json,
      });
      await vscode.window.showTextDocument(jsonDoc);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Conversion error: ${error.message}`);
    }
  });

  context.subscriptions.push(formatProvider, convertCmd);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) return undefined;
  return client.stop();
}
