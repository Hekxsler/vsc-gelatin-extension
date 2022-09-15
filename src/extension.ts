import * as vscode from 'vscode';
import * as diag from './diag';
import * as completion from './completion';
import * as help from './help';

export const dofunctions = ["fail", "next", "return", "say", "skip"]
export const outfunctions = ["add", "add_attribute", "clear_queue", "create", "enter", "enqueue_after", "enqueue_before", "enqueue_on_add", "open", "replace", "set_root_name"]

export function activate(ctx: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection('go');
    
  if (vscode.window.activeTextEditor) {
    diag.updateDiagnostics(vscode.window.activeTextEditor.document, collection);
  }
  
  let listener = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      diag.updateDiagnostics(editor.document, collection);
    }
  });
  ctx.subscriptions.push(listener)

  let listener2 = vscode.workspace.onDidChangeTextDocument(editor => {
    if (editor) {
      diag.updateDiagnostics(editor.document, collection);
    }
  });
  ctx.subscriptions.push(listener2)

  const provider = vscode.languages.registerCompletionItemProvider(
    'gelatin', {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        if (linePrefix.endsWith('do.')) {
          return completion.createCompletionItems(dofunctions);
        }
        if (linePrefix.endsWith('out.')) {
          return completion.createCompletionItems(outfunctions);
        }
        return undefined;
      }
    },
    '.' // triggered whenever a '.' is being typed
  );
  ctx.subscriptions.push(provider)

}

export function deactivate() {}
