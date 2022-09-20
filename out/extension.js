"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.outfunctions = exports.dofunctions = void 0;
const vscode = require("vscode");
const diag = require("./diag");
const compl = require("./completion");
const help = require("./help");
const hov = require("./hover");
exports.dofunctions = ["fail", "next", "return", "say", "skip"];
exports.outfunctions = ["add", "add_attribute", "clear_queue", "create", "enter", "enqueue_after", "enqueue_before", "enqueue_on_add", "open", "replace", "set_root_name"];
function activate(ctx) {
    const collection = vscode.languages.createDiagnosticCollection('go');
    if (vscode.window.activeTextEditor) {
        diag.updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
    //diagnose
    let listener = vscode.workspace.onDidChangeTextDocument(editor => {
        if (editor) {
            diag.updateDiagnostics(editor.document, collection);
        }
    });
    ctx.subscriptions.push(listener);
    //helpProvider
    let signature = vscode.languages.registerSignatureHelpProvider('gelatin', new help.SignatureProvider, '(', ',');
    ctx.subscriptions.push(signature);
    //completion
    let completion = vscode.languages.registerCompletionItemProvider('gelatin', {
        provideCompletionItems(document, position) {
            const linePrefix = document.lineAt(position).text.slice(0, position.character);
            if (linePrefix.endsWith('do.')) {
                return compl.createCompletionItems(exports.dofunctions);
            }
            if (linePrefix.endsWith('out.')) {
                return compl.createCompletionItems(exports.outfunctions);
            }
            return undefined;
        }
    }, '.' // triggered whenever a '.' is being typed
    );
    ctx.subscriptions.push(completion);
    //hover
    let hover = vscode.languages.registerHoverProvider('gelatin', new hov.HoverProvider);
    ctx.subscriptions.push(hover);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map