"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.outfunctions = exports.dofunctions = void 0;
const vscode = require("vscode");
const diag = require("./diag");
exports.dofunctions = ["fail", "next", "return", "say", "skip"];
exports.outfunctions = ["add", "add_attribute", "clear_queue", "create", "enter", "enqueue_after", "enqueue_before", "enqueue_on_add", "open", "replace", "set_root_name"];
function createCompletionItems(list) {
    let array = [];
    list.forEach(e => {
        array.push(new vscode.CompletionItem(e, vscode.CompletionItemKind.Method));
    });
    return array;
}
function activate(ctx) {
    let disposables = [];
    const collection = vscode.languages.createDiagnosticCollection('go');
    if (vscode.window.activeTextEditor) {
        diag.updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            diag.updateDiagnostics(editor.document, collection);
            vscode.window.showInformationMessage("chcek");
        }
    }, undefined, disposables);
    const provider = vscode.languages.registerCompletionItemProvider('gelatin', {
        provideCompletionItems(document, position) {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (linePrefix.endsWith('do.')) {
                return createCompletionItems(exports.dofunctions);
            }
            if (linePrefix.endsWith('out.')) {
                return createCompletionItems(exports.outfunctions);
            }
            return undefined;
        }
    }, '.' // triggered whenever a '.' is being typed
    );
    disposables.push(collection, provider);
    ctx.subscriptions.concat(disposables);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map