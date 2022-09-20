"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverProvider = void 0;
const vscode = require("vscode");
const docstringjson = require("./docstring.json");
const paramjson = require("./params.json");
const docstrings = docstringjson;
const params = paramjson;
class HoverProvider {
    provideHover(document, position, token) {
        let range = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
        let line = document.lineAt(position.line).text.trim();
        let word = document.getText(range);
        let func = line.split(".")[0];
        let docstring = docstrings[func][word];
        let construct = "";
        if (docstring) {
            let parameters = [];
            let args = params[func][word];
            for (let key in args) {
                let value = args[key];
                parameters.push(key);
                docstring = docstring + `\n\n\n_@param_ \`` + key + `\` - ` + value;
            }
            construct = "(method) " + func + "." + word + "(" + parameters.join(", ") + ")";
        }
        if (construct) {
            let hover = new vscode.Hover([{ language: 'js', value: construct }, new vscode.MarkdownString(docstring)]);
            return hover;
        }
        return undefined;
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=hover.js.map