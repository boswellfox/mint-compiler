import { readFileSync } from "fs";
import { join, dirname } from "path";

export function extractSourceFiles(entryPath) {
  const entryDir = dirname(entryPath);
  const entryCode = readFileSync(entryPath, "utf-8");

  const importedNames = new Set();
  const imports = [];

  const importRegex = /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?/g;
  let match;
  while ((match = importRegex.exec(entryCode)) !== null) {
    const names = match[1]
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const modulePath = match[2];

    for (const name of names) {
      importedNames.add(name);
    }
    imports.push({ names, modulePath });
  }

  const functions = extractTopLevelFunctions(entryCode);

  const importedFunctions = [];
  for (const imp of imports) {
    const resolvedPath = join(entryDir, imp.modulePath);
    const moduleCode = readFileSync(resolvedPath, "utf-8");
    const moduleFunctions = extractTopLevelFunctions(moduleCode);

    for (const fn of moduleFunctions) {
      if (imp.names.includes(fn.name)) {
        importedFunctions.push(fn);
      }
    }
  }

  return { functions, importedFunctions };
}

function extractTopLevelFunctions(code) {
  const functions = [];

  const funcDeclRegex = /(?:export\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = funcDeclRegex.exec(code)) !== null) {
    const name = match[1];
    const startIndex = match.index;
    const bodyStart = code.indexOf("{", startIndex);
    const body = extractBalancedBody(code, bodyStart);
    functions.push({ name, body });
  }

  return functions;
}

function extractBalancedBody(code, startIndex) {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let inTemplate = false;

  for (let i = startIndex; i < code.length; i++) {
    const ch = code[i];
    const prev = i > 0 ? code[i - 1] : "";

    if (inString) {
      if (ch === stringChar && prev !== "\\") {
        inString = false;
      }
      continue;
    }

    if (inTemplate) {
      if (ch === "`" && prev !== "\\") {
        inTemplate = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === "`") {
      inTemplate = true;
      continue;
    }

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return code.slice(startIndex + 1, i);
      }
    }
  }

  return code.slice(startIndex + 1);
}

export function buildClassSource(functions, importedFunctions, className) {
  const allFunctions = [...functions, ...importedFunctions];

  if (allFunctions.length === 0) {
    throw new Error("No functions found in the source files");
  }

  const methods = allFunctions
    .map((fn) => `    ${fn.name}() {${fn.body}    }`)
    .join("\n\n");

  return `class ${className} {\n${methods}\n}`;
}
