"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureProvider = void 0;
const vscode = require("vscode");
const docstrings = require("./docstring.json");
const params = require("./params.json");
class SignatureProvider {
    provideSignatureHelp(document, position, token) {
        let signature = new vscode.SignatureHelp();
        let range = document.getWordRangeAtPosition(position, /\S+/);
        let text = document.getText(range);
        let arg = text.split("(")[1].replace(/\)$/, "");
        let func = text.split("(")[0].split(".");
        let docstring = docstrings[func[0]][func[1]];
        let label = func[0] + "." + func[1] + "(";
        let paraminfos = [];
        if (docstring) {
            let args = params[func[0]][func[1]];
            for (let key in args) {
                let value = args[key];
                label = label + key + ", ";
                paraminfos.push(new vscode.ParameterInformation(key, value));
            }
            label = label.slice(0, -2) + ")";
            let info = new vscode.SignatureInformation(label, new vscode.MarkdownString(docstring));
            let activeParam = arg.match(",")?.length;
            info.activeParameter = activeParam ? activeParam : 0; //not working yet
            signature.signatures.push(info);
            return signature;
        }
        return undefined;
    }
}
exports.SignatureProvider = SignatureProvider;
//# sourceMappingURL=help.js.map