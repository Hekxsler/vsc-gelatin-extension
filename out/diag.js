"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDiagnostics = void 0;
const vscode = require("vscode");
const main = require("./extension");
function createDiagError(message, range) {
    return {
        message: message,
        range: range,
        severity: vscode.DiagnosticSeverity.Error,
    };
}
function getRange(y, line, string) {
    let index = line.indexOf(string);
    return new vscode.Range(new vscode.Position(y, index), new vscode.Position(y, index + string.length));
}
function testRegex(regex) {
    try {
        new RegExp(regex);
        regex.split("").forEach((e, i) => {
            if (e == "(" && !(regex[i - 1] == "\\" || regex.slice(i, i + 2) == "?:")) {
                return false;
            }
        });
        return true;
    }
    catch {
        return false;
    }
}
function updateDiagnostics(document, collection) {
    collection.clear();
    const functions = /^(do|out)/;
    const statements = /^(match|imatch|when|skip|\|)/;
    const colon = /:$/;
    const varname = /^[a-z0-9_]+$/;
    const xmlpath = /^(\w+|\.)((\?|&)\w+="[^\/&\n]+)*(\/(\w+|\.)((\?|&)\w+="[^\/&\n]+)*)*$/;
    const string = /^(?<x>'|").*\k<x>$/;
    let errors = [];
    let variables = [];
    let grammars = [];
    let indent = 0;
    for (let x = 0; x < document.lineCount - 1; x++) {
        const line = document.lineAt(x).text;
        //test define line
        if (line.startsWith("define")) {
            let define = line.split(" ");
            let name = define[1];
            let regex = define[2];
            variables.push(name);
            if (!varname.test(name)) {
                errors.push(createDiagError('Invalid variable name: "' + name + '"', getRange(x, line, name)));
            }
            if (!testRegex(regex)) {
                errors.push(createDiagError('Invalid regular expression: ' + regex, getRange(x, line, regex)));
            }
            continue;
        }
        //test grammar line
        if (line.startsWith("grammar")) {
            let grammar = line.replace("grammar ", "").replace(colon, "").split("(");
            let name = grammar[0];
            if (grammar.length > 1) {
                let parent = grammar[1].slice(0, -1);
                if (!grammars.includes(parent)) {
                    errors.push(createDiagError('Inherited grammar "' + parent + '" not defined', getRange(x, line, parent)));
                }
            }
            grammars.push(name);
            if (!varname.test(name)) {
                errors.push(createDiagError('Invalid grammar name: "' + name + '"', getRange(x, line, name)));
            }
            continue;
        }
        const trimmed = line.trimStart();
        if (line.length == trimmed.length) {
            continue;
        }
        //check indentation
        let ind = line.length - trimmed.length;
        if (indent == 0)
            indent = ind;
        if (!(ind == 0 || ind == indent || ind == 2 * indent)) {
            errors.push(createDiagError('Invalid indentation', getRange(x, line, line)));
        }
        //test statement line
        if (statements.test(trimmed)) {
            let regexs = trimmed.replace(colon, "").split(" ");
            for (let r = 1; r < regexs.length - 1; r++) {
                let regex = regexs[r];
                let except = /^(\/|"|')/;
                if (!(except.test(regex) || variables.includes(regex))) {
                    errors.push(createDiagError('Undefined variable: "' + regex + '"', getRange(x, line, regex)));
                }
                else {
                    if (!testRegex(regex)) {
                        errors.push(createDiagError('Invalid regular expression: ' + regex, getRange(x, line, regex)));
                    }
                }
            }
            continue;
        }
        //test function line
        if (functions.test(trimmed)) {
            let statement = trimmed.split(".");
            let func = statement[1].split("(");
            if (statement[0] == "do") {
                if (!main.dofunctions.includes(func[0])) {
                    errors.push(createDiagError('Invalid function. "do" has no function "' + func[0] + '"', getRange(x, line, line.trim())));
                }
            }
            if (statement[0] == "out") {
                if (!main.outfunctions.includes(func[0])) {
                    errors.push(createDiagError('Invalid function. "out" has no function "' + func[0] + '"', getRange(x, line, line.trim())));
                }
                let args = func[1].slice(0, -1).split(", ");
                switch (func[0]) {
                    case "create":
                    case "add":
                    case "open":
                    case "replace":
                    case "enter":
                        if (!xmlpath.test(args[0].slice(1, -1))) {
                            errors.push(createDiagError('Invalid xml path.', getRange(x, line, args[0])));
                        }
                        if (args.length > 1 && !string.test(args[1])) {
                            vscode.window.showInformationMessage(args[1]);
                            errors.push(createDiagError('Value must be a string.', getRange(x, line, args[1])));
                        }
                        if (args.length > 2) {
                            errors.push(createDiagError('Too many arguments. Expected 2 but got ' + args.length, getRange(x, line, func[1].split(args[1])[1])));
                        }
                        break;
                    case "":
                }
            }
            continue;
        }
        if (trimmed.length > 0) {
            errors.push(createDiagError('Invalid statement', getRange(x, line, line.trim())));
        }
    }
    collection.set(document.uri, errors);
}
exports.updateDiagnostics = updateDiagnostics;
//# sourceMappingURL=diag.js.map