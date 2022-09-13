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
    const listener = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDiagnostics(editor.document, collection);
        }
    });
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
    ctx.subscriptions.push(collection, provider, listener);
}
exports.activate = activate;
function createDiagError(message, range) {
    return {
        message: message,
        range: range,
        severity: vscode.DiagnosticSeverity.Error,
    };
}
function getRange(y, line, string) {
    return new vscode.Range(new vscode.Position(y, line.indexOf(string)), new vscode.Position(y, line.lastIndexOf(string)));
}
function updateDiagnostics(document, collection) {
    collection.clear();
    if (document.fileName.endsWith('.gel')) {
        let errors = [];
        let variables = [];
        let grammars = [];
        let indent = 0;
        for (let x = 0; x < document.lineCount - 1; x++) {
            let line = document.lineAt(x).text;
            //test define line
            if (line.startsWith("define")) {
                var define = line.replace("define ", "").split(" ");
                let name = define[0];
                let regex = define[1];
                if (name.match(new RegExp('[a-z0-9_]+'))) {
                    try {
                        variables.push(name);
                    }
                    catch {
                        errors.push(createDiagError('Invalid regular expression: ' + regex, getRange(x, line, regex)));
                    }
                }
                else {
                    errors.push(createDiagError('Invalid variable name: "' + name + '"', getRange(x, line, name)));
                }
                continue;
            }
            //test grammar line
            if (line.startsWith("grammar")) {
                var grammar = line.replace("grammar ", "").slice(0, -1).split("(");
                let name = grammar[0];
                if (grammar.length > 1) {
                    let parent = grammar[1].slice(0, -1);
                    if (parent && grammars.includes(parent)) {
                        errors.push(createDiagError('Inherited grammar "' + parent + '" not defined', getRange(x, line, parent)));
                    }
                }
                if (name.match(new RegExp('[a-z0-9_]+'))) {
                    grammars.push(name);
                }
                else {
                    errors.push(createDiagError('Invalid grammar name: "' + name + '"', getRange(x, line, name)));
                }
                continue;
            }
            let trimmed = line.trimStart();
            if (line == trimmed) {
                continue;
            }
            let ind = line.replace(trimmed, '').length;
            if (ind < 2 || !(Number.isInteger(ind % indent) || Number.isInteger(indent % ind))) {
                errors.push(createDiagError('Inconsistent indentation', getRange(x, line, trimmed)));
            }
            if (indent == 0)
                indent = ind;
            //test match line
            if (trimmed.startsWith("match")) {
                var regexs = trimmed.replace("match ", "").split(" ");
                for (let r = 0; r < regexs.length - 1; r++) {
                    let regex = regexs[r];
                    if (regex.startsWith("/")) {
                        try {
                            new RegExp(regex);
                        }
                        catch {
                            errors.push(createDiagError('Invalid regular expression', getRange(x, line, regex)));
                        }
                    }
                    if (!(regex.startsWith("'") || variables.includes(regex))) {
                        errors.push(createDiagError('Undefined variable: "' + regex + '"', getRange(x, line, regex)));
                    }
                }
                continue;
            }
            if (trimmed.length > 0) {
                errors.push(createDiagError('Invalid statement', getRange(x, line, line.trim())));
            }
        }
        collection.set(document.uri, errors);
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map