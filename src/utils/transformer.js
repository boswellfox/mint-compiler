import { readFileSync } from "fs";
import { join, dirname } from "path";
import * as acorn from "acorn";

export function extractSourceFiles(entryPath) {
  const entryDir = dirname(entryPath);
  const entryCode = readFileSync(entryPath, "utf-8");

  const importedNames = new Set();
  const importsByModule = new Map();

  let entryAst;
  try {
    entryAst = acorn.parse(entryCode, {
      ecmaVersion: 2022,
      sourceType: "module",
    });
  } catch {
    entryAst = null;
  }

  if (entryAst) {
    for (const node of entryAst.body) {
      if (node.type === "ImportDeclaration") {
        const modulePath = node.source.value;
        if (!importsByModule.has(modulePath)) {
          importsByModule.set(modulePath, {
            exportedNames: new Set(),
            localNameMap: new Map(),
          });
        }
        const entry = importsByModule.get(modulePath);
        for (const spec of node.specifiers) {
          const localName = spec.local.name;
          let exportedName;
          if (spec.type === "ImportSpecifier") {
            exportedName = spec.imported.name;
          } else if (spec.type === "ImportDefaultSpecifier") {
            exportedName = "default";
          } else if (spec.type === "ImportNamespaceSpecifier") {
            exportedName = "*";
          }
          importedNames.add(localName);
          entry.exportedNames.add(exportedName);
          entry.localNameMap.set(exportedName, localName);
        }
      }
    }
  }

  const functions = extractTopLevelFunctions(entryCode);

  const processedNames = new Map();
  const importedFunctions = [];

  function collectFromModule(
    modulePath,
    requestedNames,
    baseDir,
    localNameMap,
  ) {
    const resolvedPath = join(baseDir, modulePath);
    const alreadyProcessed = processedNames.get(resolvedPath) || new Set();
    const newNames = requestedNames.filter((n) => !alreadyProcessed.has(n));
    if (newNames.length === 0) {
      return;
    }

    const moduleCode = readFileSync(resolvedPath, "utf-8");
    const moduleFunctions = extractTopLevelFunctions(moduleCode);

    for (const fn of moduleFunctions) {
      if (newNames.includes(fn.name)) {
        const localName = localNameMap.get(fn.name) || fn.name;
        importedFunctions.push({ ...fn, name: localName });
      }
    }

    const updated = new Set(alreadyProcessed);
    for (const n of newNames) {
      updated.add(n);
    }
    processedNames.set(resolvedPath, updated);

    const moduleDir = dirname(resolvedPath);
    let moduleAst;
    try {
      moduleAst = acorn.parse(moduleCode, {
        ecmaVersion: 2022,
        sourceType: "module",
      });
    } catch {
      return;
    }

    for (const node of moduleAst.body) {
      if (
        node.type === "ImportDeclaration" &&
        node.source.value.startsWith(".")
      ) {
        const innerPath = node.source.value;
        const innerMapping = new Map();
        const innerNames = [];
        for (const spec of node.specifiers) {
          let innerExportedName;
          if (spec.type === "ImportSpecifier") {
            innerExportedName = spec.imported.name;
          } else if (spec.type === "ImportDefaultSpecifier") {
            innerExportedName = "default";
          } else if (spec.type === "ImportNamespaceSpecifier") {
            innerExportedName = "*";
          }
          innerMapping.set(innerExportedName, spec.local.name);
          innerNames.push(innerExportedName);
        }
        collectFromModule(innerPath, innerNames, moduleDir, innerMapping);
      }
    }
  }

  for (const [modulePath, info] of importsByModule) {
    collectFromModule(
      modulePath,
      [...info.exportedNames],
      entryDir,
      info.localNameMap,
    );
  }

  return { functions, importedFunctions };
}

function extractFunctionInfo(fnNode, code) {
  const name = fnNode.id.name;
  const params =
    fnNode.params.length > 0
      ? code.slice(
          fnNode.params[0].start,
          fnNode.params[fnNode.params.length - 1].end,
        )
      : "";
  const body =
    fnNode.body.body.length > 0
      ? code.slice(
          fnNode.body.body[0].start,
          fnNode.body.body[fnNode.body.body.length - 1].end,
        )
      : "";
  return { name, params, body };
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
      functions.push(extractFunctionInfo(node, code));
    }

    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "FunctionDeclaration" &&
      node.declaration.id
    ) {
      functions.push(extractFunctionInfo(node.declaration, code));
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
