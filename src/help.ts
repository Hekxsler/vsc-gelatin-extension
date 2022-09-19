import * as vscode from 'vscode';
import * as docstrings from './docstring.json';
import * as params from './params.json';

export class SignatureProvider implements vscode.SignatureHelpProvider {
    public provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        let signature = new vscode.SignatureHelp();
        let range = document.getWordRangeAtPosition(position, /\S+/)
        let text = document.getText(range)
        let arg = text.split("(")[1].replace(/\)$/, "")
        let func = text.split("(")[0].split(".");
        let docstring: string = docstrings[func[0]][func[1]]
        let label = func[0]+"."+func[1]+"("
        let paraminfos = []

        if(docstring){
            let args: {[key: string]: string} = params[func[0]][func[1]]
            for (let key in args) {
                let value = args[key];
                label = label+key+", "
                paraminfos.push(new vscode.ParameterInformation(key, value))
            }

            label = label.slice(0,-2)+")"
            let info = new vscode.SignatureInformation(label, new vscode.MarkdownString(docstring))
            let activeParam = arg.match(",")?.length
            info.activeParameter = activeParam ? activeParam : 0 //not working yet
            signature.signatures.push(info)
            return signature;
        }

        return undefined;
    }
}