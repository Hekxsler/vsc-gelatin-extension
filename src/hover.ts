import * as vscode from 'vscode';
import * as docstringjson from './docstring.json';
import * as paramjson from './params.json';

const docstrings: {[func: string]: {[arg: string]: string}} = docstringjson
const params: {[func: string]: {[arg: string]: {[key: string]: string}}} = paramjson

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
        
        if(construct){
            let hover = new vscode.Hover([{language: 'js', value: construct}, new vscode.MarkdownString(docstring)]);
            return hover;
        }

        return undefined;
    }
}