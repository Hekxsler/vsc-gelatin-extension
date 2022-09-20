import * as vscode from 'vscode';
import * as main from './extension';

export var variables: {[name: string]: string} = {};

const varname = /^[a-z0-9_]+$/
const xmlpath = /^(\w+|\.)((\?|&)\w+="[^\/&\n]+)*(\/(\w+|\.)((\?|&)\w+="[^\/&\n]+)*)*$/;
const string = /^(?<x>'|").*\k<x>$/


function createDiagError(message: string, range: vscode.Range): {range:vscode.Range, message:string, severity:vscode.DiagnosticSeverity} {
  return {
    message: message,
    range: range,
    severity: vscode.DiagnosticSeverity.Error,
  };
}

function argAmountDiagError(should: number, has: number, range: vscode.Range) {
  if(should > has) return createDiagError('Too many arguments. Expected '+should+' but got '+has, range);
  return createDiagError('Missing argument(s). Expected '+should+' but got '+has, range);
}


function getRange(y: number, line: string, string: string): vscode.Range {
  let index = line.indexOf(string)
  return new vscode.Range(new vscode.Position(y, index), new vscode.Position(y, index+string.length));
}


function testRegex(regex: string): boolean {
  try{
    new RegExp(regex);
    regex.split("").forEach((e: string, i: number) => {
      if(e == "(" && !(regex[i-1] == "\\" || regex.slice(i, i+2) == "?:")){
        return false;
      }
    });
    return true;
  }catch{
    return false;
  }
}


function testArgs(path: string, str: string, regex: string, x: number, line: string){
  let errors = [];
  if(path && !xmlpath.test(path)){
    errors.push(createDiagError('Invalid xml path.', getRange(x, line, path)));
  }
  if(str && !string.test(str)){
    errors.push(createDiagError('Value must be a string.', getRange(x, line, str)));
  }
  if(regex && !testRegex(regex)){
    errors.push(createDiagError('Invalid regular expression: '+regex, getRange(x, line, regex)));
  }
  return errors;
}


function diagOutFunction(func: string, args: string[], x: number, line: string) {
  let errors = [];
  let path = "";
  let str = "";
  let regex = "";
  let minargs = 0;
  let maxargs = 0;

  switch(func) {
    case "create":
    case "add":
    case "open":
    case "replace":
    case "enter":
      path = args[0].slice(1, -1)
      str = args[1]
      minargs = 1
      maxargs = 2
      break
    case "add_attribute":
      path = args[0].slice(1, -1)
      str = args[2]
      minargs = 3
      maxargs = 3
      if(args.length == minargs && !varname.test(args[1])){
        errors.push(createDiagError('Invalid name.', getRange(x, line, args[1])));
      }
      break
    case "enqueue_after":
    case "enqueue_before":
    case "enqueue_on_add":
      regex = args[0]
      path = args[1].slice(1, -1)
      str = args[2]
      minargs = 2
      maxargs = 3
      break
    case "set_root_name":
      str = args[0]
      minargs = 1
      maxargs = 1
  }
  
  errors.push(argAmountDiagError(minargs, args.length, getRange(x, line, args[maxargs-1])))
  errors.push(argAmountDiagError(maxargs, args.length, getRange(x, line, func)))
  errors.concat(testArgs(path, str, regex, x, line))
  return errors;
}


function diagDoFunction(func: string, args: string[], x: number, line: string) {
  let errors = [];
  let str = "";
  let minargs = 0;
  let maxargs = 0;

  switch(func) {
    case "say":
    case "fail":
      minargs = 1
      maxargs = 1
      str = args[0]
  }
  
  errors.push(argAmountDiagError(minargs, args.length, getRange(x, line, args[maxargs-1])))
  errors.push(argAmountDiagError(maxargs, args.length, getRange(x, line, func)))
  errors.concat(testArgs("", str, "", x, line))
  return errors;
}


export function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
  collection.clear()
  const functions = /^(do|out)/;
  const statements = /^(match|imatch|when|skip|\|)/;
  const colon = /:$/
  let errors: vscode.Diagnostic[] = [];
  let grammars: string[] = [];
  let indent: number = 0;
  
  for(let x = 0; x < document.lineCount-1; x++){
    const line = document.lineAt(x).text;
    
    //test define line
    if(line.startsWith("define")){
      let define = line.split(" ")
      let name = define[1];
      let regex = define[2];
      if(!varname.test(name)){
        errors.push(createDiagError('Invalid variable name: "'+name+'"', getRange(x, line, name)));
      }
      if(!testRegex(regex)){
        errors.push(createDiagError('Invalid regular expression: '+regex, getRange(x, line, regex)));
      }
      variables[name] = regex
      continue
    }

    //test grammar line
    if(line.startsWith("grammar")){
      let grammar = line.replace("grammar ", "").replace(colon, "").split("(")
      let name = grammar[0];
      if(grammar.length > 1){
        let parent = grammar[1].slice(0, -1);
        if(!grammars.includes(parent)){
          errors.push(createDiagError('Inherited grammar "'+parent+'" not defined', getRange(x, line, parent)));
        }
      }
      grammars.push(name);
      if(!varname.test(name)){
        errors.push(createDiagError('Invalid grammar name: "'+name+'"', getRange(x, line, name)));
      }
      continue
    }

    const trimmed = line.trimStart()
    if(line.length == trimmed.length){
      continue
    }

    //check indentation
    let ind = line.length - trimmed.length;
    if(indent == 0) indent = ind;
    if(!(ind == 0 || ind == indent || ind == 2*indent)){
      errors.push(createDiagError('Invalid indentation', getRange(x, line, line)));
    }


    //test statement line
    if(statements.test(trimmed)){
      let regexs = trimmed.replace(colon, "").split(" ");
      for(let r = 1; r < regexs.length; r++){
        let regex = regexs[r];
        let except = /^(\/|"|')/
        if(!(except.test(regex) || variables[regex])){
          errors.push(createDiagError('Undefined variable: "'+regex+'"', getRange(x, line, regex)));
        }else{
          if(!testRegex(regex)){
            errors.push(createDiagError('Invalid regular expression: '+regex, getRange(x, line, regex)));
          }else{
            for(let key in variables){
              if(variables[key] == regex){
                errors.push(new vscode.Diagnostic(getRange(x, line, regex), "Regular expression is already defined as \""+key+"\"", vscode.DiagnosticSeverity.Warning))
              }
            }
          }
        }
      }
      continue
    }

    //test function line
    if(functions.test(trimmed)){
      let statement = trimmed.split(".");
      let func = statement[1].split("(")
      let args: string[] = [];
      if(func.length > 1) args = func[1].slice(0, -1).split(", ");
      if(statement[0] == "do"){
        if(!main.dofunctions.includes(func[0])){
          errors.push(createDiagError('Invalid function. "do" has no function "'+func[0]+'"', getRange(x, line, line.trim())));
        }else{
          errors.concat(diagDoFunction(func[0], args, x, line))
        }
      }
      if(statement[0] == "out"){
        if(!main.outfunctions.includes(func[0])){
          errors.push(createDiagError('Invalid function. "out" has no function "'+func[0]+'"', getRange(x, line, line.trim())));
        }else{
          errors.concat(diagOutFunction(func[0], args, x, line))
        }
      }
      continue
    }
    
    if(trimmed.length > 0){
      errors.push(createDiagError('Invalid statement', getRange(x, line, line.trim())));
    }
  }

  collection.set(document.uri, errors)
}