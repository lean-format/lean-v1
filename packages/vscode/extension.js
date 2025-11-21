const vscode = require('vscode');

// Import LEAN core library for parsing, formatting, and validation
const { parse, format, validate } = require('@lean-format/core');

function activate(context) {
    console.log('LEAN format extension is now active');

    // Register formatting provider
    const formatProvider = vscode.languages.registerDocumentFormattingEditProvider('lean', {
        provideDocumentFormattingEdits(document) {
            try {
                const text = document.getText();

                // Parse LEAN content to validate syntax
                const parsed = parse(text);

                // Format it back to LEAN with proper indentation
                const formatted = format(parsed, {
                    indent: '  ',
                    useRowSyntax: true
                });

                // Create edit to replace entire document
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );

                return [vscode.TextEdit.replace(fullRange, formatted)];
            } catch (error) {
                // Show error message but don't throw to avoid VS Code error dialog
                vscode.window.showErrorMessage(`LEAN format error: ${error.message}`);
                return [];
            }
        }
    });

    // Register validation command
    const validateCommand = vscode.commands.registerCommand('lean.validate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        if (document.languageId !== 'lean') {
            vscode.window.showWarningMessage('This command only works with LEAN files');
            return;
        }

        try {
            const text = document.getText();
            const result = validate(text, { strict: false });

            if (result.valid) {
                vscode.window.showInformationMessage('✓ LEAN file is valid');
            } else {
                // Format errors for display
                const errorMessages = result.errors.map(err =>
                    `Line ${err.line || '?'}: ${err.message}`
                ).join('\n');
                vscode.window.showErrorMessage(`Validation errors:\n${errorMessages}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Validation error: ${error.message}`);
        }
    });

    // Register convert to JSON command
    const convertToJsonCommand = vscode.commands.registerCommand('lean.convertToJson', async () => {
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

            // Pretty-print JSON
            const json = JSON.stringify(result, null, 2);

            // Create new document with JSON content
            const jsonDoc = await vscode.workspace.openTextDocument({
                language: 'json',
                content: json
            });

            await vscode.window.showTextDocument(jsonDoc);
        } catch (error) {
            vscode.window.showErrorMessage(`Conversion error: ${error.message}`);
        }
    });

    context.subscriptions.push(formatProvider, validateCommand, convertToJsonCommand);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
