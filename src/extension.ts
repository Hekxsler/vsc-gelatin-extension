import * as vscode from 'vscode';
import * as diag from './diag';
import * as compl from './completion';
import * as help from './help';
import * as hov from './hover';


export const dofunctions = ["fail", "next", "return", "say", "skip"]
export const outfunctions = ["add", "add_attribute", "clear_queue", "create", "enter", "enqueue_after", "enqueue_before", "enqueue_on_add", "open", "replace", "set_root_name"]

export function activate(ctx: vscode.ExtensionContext) {
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
  ctx.subscriptions.push(listener)

  //helpProvider
  let signature = vscode.languages.registerSignatureHelpProvider(
    'gelatin', new help.SignatureProvider, '(', ','
  )
  ctx.subscriptions.push(signature)

  //completion
  let completion = vscode.languages.registerCompletionItemProvider(
    'gelatin', {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const linePrefix = document.lineAt(position).text.slice(0, position.character);
        if (linePrefix.endsWith('do.')) {
          return compl.createCompletionItems(dofunctions);
        }
        if (linePrefix.endsWith('out.')) {
          return compl.createCompletionItems(outfunctions);
        }
        return undefined;
      }
    },
    '.' // triggered whenever a '.' is being typed
  );
  ctx.subscriptions.push(completion)

  //hover
  let hover = vscode.languages.registerHoverProvider(
    'gelatin', new hov.HoverProvider
  )
  ctx.subscriptions.push(hover)

}

export function deactivate() {}
