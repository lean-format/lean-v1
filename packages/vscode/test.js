const fs = require('fs');

// Mock vscode module
const vscode = {
    languages: {
        registerDocumentFormattingEditProvider: () => ({ dispose: () => {} }),
        createDiagnosticCollection: () => ({ set: () => {}, delete: () => {}, dispose: () => {} })
    },
    commands: {
        registerCommand: () => ({ dispose: () => {} })
    },
    workspace: {
        onDidOpenTextDocument: () => ({ dispose: () => {} }),
        onDidChangeTextDocument: () => ({ dispose: () => {} }),
        onDidCloseTextDocument: () => ({ dispose: () => {} }),
        textDocuments: []
    },
    Range: class { constructor() {} },
    Position: class { constructor() {} },
    Diagnostic: class { constructor() {} },
    DiagnosticSeverity: { Error: 0 }
};

// Require extension from dist
try {
    // We have to put vscode into the require cache so dist/extension.js can require it
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id) {
        if (id === 'vscode') return vscode;
        return originalRequire.apply(this, arguments);
    };

    const extension = require('./dist/extension.js');
    console.log("Successfully loaded dist/extension.js");
    
    // Test activate
    const context = { subscriptions: [] };
    extension.activate(context);
    console.log("Successfully activated extension. WASM loaded!");
    
    process.exit(0);
} catch (e) {
    console.error("Failed to load or activate extension:", e);
    process.exit(1);
}
