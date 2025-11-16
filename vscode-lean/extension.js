const vscode = require('vscode');

function activate(context) {
    console.log('LEAN format extension is now active');

    // Register formatting provider
    const formatProvider = vscode.languages.registerDocumentFormattingEditProvider('lean', {
        provideDocumentFormattingEdits(document) {
            const edits = [];
            const text = document.getText();
            
            // Basic auto-formatting logic
            const lines = text.split('\n');
            let formatted = [];
            let expectedIndent = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                
                // Skip empty lines and comments
                if (!trimmed || trimmed.startsWith('#')) {
                    formatted.push(line);
                    continue;
                }
                
                // Detect indentation level
                const currentIndent = line.match(/^(\s*)/)[1].length;
                
                // Format the line with proper indentation
                const indent = '  '.repeat(expectedIndent);
                formatted.push(indent + trimmed);
                
                // Adjust expected indent for next line
                if (trimmed.endsWith(':')) {
                    expectedIndent++;
                } else if (trimmed.startsWith('-')) {
                    // Keep same indent
                } else if (currentIndent === 0 && expectedIndent > 0) {
                    expectedIndent = 0;
                }
            }
            
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            
            edits.push(vscode.TextEdit.replace(fullRange, formatted.join('\n')));
            return edits;
        }
    });

    // Register commands
    const validateCommand = vscode.commands.registerCommand('lean.validate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const document = editor.document;
        if (document.languageId !== 'lean') {
            vscode.window.showWarningMessage('This command only works with LEAN files');
            return;
        }
        
        // Basic validation
        const text = document.getText();
        const lines = text.split('\n');
        let errors = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('#')) continue;
            
            // Check for mixed indentation
            const spaces = line.match(/^( *)/)[1].length;
            const tabs = line.match(/^(\t*)/)[1].length;
            
            if (spaces > 0 && tabs > 0) {
                errors.push({
                    line: i + 1,
                    message: 'Mixed spaces and tabs'
                });
            }
        }
        
        if (errors.length === 0) {
            vscode.window.showInformationMessage('✓ LEAN file is valid');
        } else {
            const message = errors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
            vscode.window.showErrorMessage(`Validation errors:\n${message}`);
        }
    });

    const convertToJsonCommand = vscode.commands.registerCommand('lean.convertToJson', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        vscode.window.showInformationMessage('Use the LEAN CLI tool to convert to JSON: lean parse file.lean');
    });

    context.subscriptions.push(formatProvider, validateCommand, convertToJsonCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
