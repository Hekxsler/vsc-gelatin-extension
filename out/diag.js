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
    const functions = new RegExp('^(do|out)');
    const statements = new RegExp('^(match |imatch |when |skip |\| )');
    const colon = new RegExp(':$');
    const varname = new RegExp('^[a-z0-9_]+$');
    let errors = [];
    let variables = [];
    let grammars = [];
    let indent = 0;
    for (let x = 0; x < document.lineCount - 1; x++) {
        let line = document.lineAt(x).text;
        //test define line
        if (line.startsWith("define")) {
            var define = line.split(" ");
            let name = define[1];
            let regex = define[2];
            variables.push(name);
            if (!varname.test(name)) {
                errors.push(createDiagError('Invalid variable name: "' + name + '"', getRange(x, line, name)));
            }
            if (!testRegex(regex)) {
                errors.push(createDiagError('Invalid regular expression: ' + regex, getRange(x, line, regex)));
            }
            vscode.window.showInformationMessage(x + ": " + define);
            continue;
        }
        //test grammar line
        if (line.startsWith("grammar")) {
            var grammar = line.replace("grammar ", "").replace(colon, "").split("(");
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
        let trimmed = line.trimStart();
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
            var regexs = trimmed.replace(colon, "").split(" ");
            for (let r = 1; r < regexs.length - 1; r++) {
                let regex = regexs[r];
                let except = new RegExp('^(\/|"|\')');
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
            var args = trimmed.split(".");
            let attr = args[1].split("(")[0];
            if (args[0] == "do") {
                if (!main.dofunctions.includes(attr)) {
                    errors.push(createDiagError('Invalid function. "do" has no attribute "' + args[1] + '"', getRange(x, line, line.trim())));
                }
            }
            if (args[0] == "out") {
                if (!main.outfunctions.includes(attr)) {
                    errors.push(createDiagError('Invalid function. "out" has no attribute "' + args[1] + '"', getRange(x, line, line.trim())));
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