"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
let diagnosticCollection;
function activate(ctx) {
    const collection = vscode.languages.createDiagnosticCollection('go');
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    ctx.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDiagnostics(editor.document, collection);
        }
    }));
    const provider = vscode.languages.registerCompletionItemProvider('gelatin', {
        provideCompletionItems(document, position) {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (linePrefix.endsWith('do.')) {
                return [
                    new vscode.CompletionItem('fail', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('next', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('return', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('say', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('skip', vscode.CompletionItemKind.Method),
                ];
            }
            if (linePrefix.endsWith('out.')) {
                return [
                    new vscode.CompletionItem('add', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('add_attribute', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('clear_queue', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('create', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('enter', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('enqueue_after', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('enqueue_before', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('enqueue_on_add', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('open', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('replace', vscode.CompletionItemKind.Method),
                    new vscode.CompletionItem('set_root_name', vscode.CompletionItemKind.Method),
                ];
            }
            return undefined;
        }
    }, '.' // triggered whenever a '.' is being typed
    );
    ctx.subscriptions.push(collection, provider);
}
exports.activate = activate;
function createDiagError(document, collection, message, range) {
    collection.set(document.uri, [{
            code: '',
            message: message,
            range: range,
            severity: vscode.DiagnosticSeverity.Error,
            source: '',
            relatedInformation: []
        }]);
}
function getRange(y, x1, x2, y2) {
    return new vscode.Range(new vscode.Position(y, x1), new vscode.Position(((y2) ? y2 : y), x2));
}
function updateDiagnostics(document, collection) {
    if (document.fileName.endsWith('.gel')) {
        let variables = [];
        for (let x = 0; x < document.lineCount - 1; x++) {
            let line = document.lineAt(x).text;
            if (line.startsWith("define")) {
                var define = line.replace("define ", "").split(" ");
                let varname = define[0];
                let regex = define[1];
                if (varname.match(new RegExp('[a-z0-9_]+'))) {
                    if () {
                    }
                    else {
                        createDiagError(document, collection, 'Invalid regular expression', getRange(x, line.indexOf(regex), line.lastIndexOf(regex)));
                    }
                }
                else {
                    createDiagError(document, collection, 'Invalid variable name', getRange(x, 7, 7 + varname.length));
                }
            }
            createDiagError(document, collection, 'Invalid statement', getRange(x, 0, line.length - 1));
        }
    }
    else {
        collection.clear();
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map