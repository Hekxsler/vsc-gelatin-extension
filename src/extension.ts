import * as vscode from 'vscode';
import * as diag from './diag';

export const dofunctions = ["fail", "next", "return", "say", "skip"]
export const outfunctions = ["add", "add_attribute", "clear_queue", "create", "enter", "enqueue_after", "enqueue_before", "enqueue_on_add", "open", "replace", "set_root_name"]

function createCompletionItems(list: Array<string>): Array<vscode.CompletionItem> {
  let array: vscode.CompletionItem[] = [];
  list.forEach(e => {
    array.push(new vscode.CompletionItem(e, vscode.CompletionItemKind.Method));
  })
  return array;
}

export function activate(ctx: vscode.ExtensionContext) {
  let disposables: vscode.Disposable[] = [];
  const collection = vscode.languages.createDiagnosticCollection('go');
	
  if (vscode.window.activeTextEditor) {
		diag.updateDiagnostics(vscode.window.activeTextEditor.document, collection);
	}
	
  vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			diag.updateDiagnostics(editor.document, collection);
      vscode.window.showInformationMessage("chcek")
		}
	},undefined,disposables);

  const provider = vscode.languages.registerCompletionItemProvider(
		'gelatin',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (linePrefix.endsWith('do.')) {
					return createCompletionItems(dofunctions);
				}
        if (linePrefix.endsWith('out.')) {
					return createCompletionItems(outfunctions);
				}
				return undefined;
			}
		},
		'.' // triggered whenever a '.' is being typed
	);

  disposables.push(collection, provider)
  ctx.subscriptions.concat(disposables);
}

export function deactivate() {}
