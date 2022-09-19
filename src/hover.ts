import * as vscode from 'vscode';
import * as diag from './diag';
import * as docstrings from './docstring.json';
import * as params from './params.json';

export class HoverProvider implements vscode.HoverProvider {
    public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        let range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/)
        let line = document.lineAt(position.line).text.trim()
        let word = document.getText(range)
        let func = line.split(".")[0]
        let docstring: string = docstrings[func][word]
        let construct = ""
        
        if(docstring){
            let parameters: string[] = [];
            let args: {[key: string]: string} = params[func][word]
            for (let key in args) {
                let value = args[key];
                parameters.push(key)
                docstring = docstring+`\n\n\n_@param_ \``+key+`\` - `+value
            }
            construct = "(method) "+func+"."+word+"("+parameters.join(", ")+")"
        }

        if(diag.variables[word]){
            construct = "(variable) "+word+" = "+diag.variables[word]
        }
        
        let hover = new vscode.Hover([{language: 'js', value: construct}, new vscode.MarkdownString(docstring)]);

        return hover;
    }
}