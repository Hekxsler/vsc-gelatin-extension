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
  const listener = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      diag.updateDiagnostics(editor.document, collection);
    }
  });

  //helpProvider
  const signature = vscode.languages.registerSignatureHelpProvider(
    'gelatin', new help.SignatureProvider, '(', ','
  )

  //completion
  const completion = vscode.languages.registerCompletionItemProvider(
    'gelatin', {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
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

  //hover
  const hover = vscode.languages.registerHoverProvider(
    'gelatin', new hov.HoverProvider
  )
  
  
  ctx.subscriptions.push(listener, signature, completion, hover)
}

export function deactivate() {}
