import { readFileSync } from "fs";
import { join, dirname } from "path";
import * as acorn from "acorn";

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

  const visited = new Set();
  const importedFunctions = [];

  function collectFromModule(modulePath, requestedNames, baseDir) {
    const resolvedPath = join(baseDir, modulePath);
    if (visited.has(resolvedPath)) {
      return;
    }
    visited.add(resolvedPath);

    const moduleCode = readFileSync(resolvedPath, "utf-8");
    const moduleFunctions = extractTopLevelFunctions(moduleCode);

    for (const fn of moduleFunctions) {
      if (requestedNames.includes(fn.name)) {
        importedFunctions.push(fn);
      }
    }

    const moduleDir = dirname(resolvedPath);
    const innerImportRegex =
      /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?/g;
    let innerMatch;
    while ((innerMatch = innerImportRegex.exec(moduleCode)) !== null) {
      const innerNames = innerMatch[1]
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      const innerPath = innerMatch[2];
      if (innerPath.startsWith(".")) {
        collectFromModule(innerPath, innerNames, moduleDir);
      }
    }
  }

  for (const imp of imports) {
    collectFromModule(imp.modulePath, imp.names, entryDir);
  }

  return { functions, importedFunctions };
}

function extractTopLevelFunctions(code) {
  let ast;
  try {
    ast = acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: "module",
    });
  } catch {
    return [];
  }

  const functions = [];

  for (const node of ast.body) {
    if (node.type === "FunctionDeclaration" && node.id) {
      const paramSource =
        node.params.length > 0
          ? code.slice(
              node.params[0].start,
              node.params[node.params.length - 1].end,
            )
          : "";
      const body = code.slice(
        node.body.body[0] ? node.body.body[0].start : node.body.start + 1,
        node.body.end - 1,
      );
      functions.push({
        name: node.id.name,
        body,
        params: paramSource,
      });
    }

    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "FunctionDeclaration" &&
      node.declaration.id
    ) {
      const fn = node.declaration;
      const paramSource =
        fn.params.length > 0
          ? code.slice(fn.params[0].start, fn.params[fn.params.length - 1].end)
          : "";
      const body =
        fn.body.body.length > 0
          ? code.slice(
              fn.body.body[0].start,
              fn.body.body[fn.body.body.length - 1].end,
            )
          : "";
      functions.push({
        name: fn.id.name,
        body,
        params: paramSource,
      });
    }
  }

  return functions;
}

export function buildClassSource(functions, importedFunctions, className) {
  const allFunctions = [...functions, ...importedFunctions];

  if (allFunctions.length === 0) {
    throw new Error("No functions found in the source files");
  }

  const methods = allFunctions
    .map((fn) => {
      const params = fn.params || "";
      return `    ${fn.name}(${params}) {${fn.body}    }`;
    })
    .join("\n\n");

  return `class ${className} {\n${methods}\n}`;
}
