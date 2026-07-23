import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import prettier from "prettier";
import { readManifest } from "../utils/manifest.js";
import { getGitRemoteUrl } from "../utils/git.js";
import { generateHeader } from "../utils/header.js";
import { extractSourceFiles, buildClassSource } from "../utils/transformer.js";

export async function buildCommand() {
  const cwd = process.cwd();
  const srcDir = join(cwd, "src");
  const distDir = join(cwd, "dist");
  const entryPoint = join(srcDir, "00-index.js");

  if (!existsSync(entryPoint)) {
    console.error(
      "Error: src/00-index.js not found. Run 'mint-compiler init' first.",
    );
    process.exit(1);
  }

  console.log("Reading manifest...");
  const manifest = readManifest(srcDir);

  console.log("Extracting and tree-shaking source files...");
  const { functions, importedFunctions } = extractSourceFiles(entryPoint);

  console.log(
    `  Found ${functions.length} local function(s), ${importedFunctions.length} imported function(s)`,
  );

  console.log("Building class...");
  const classCode = buildClassSource(
    functions,
    importedFunctions,
    manifest.class,
  );

  console.log("Fetching git repository URL...");
  const repoUrl = getGitRemoteUrl();

  console.log("Generating header...");
  const header = generateHeader(manifest, repoUrl);

  const iife = `${header}

(function (Scratch) {
  "use strict";

${classCode}

  Scratch.extensions.register(new ${manifest.class}());
})(Scratch);`;

  console.log("Formatting output...");
  let formatted;
  try {
    formatted = await prettier.format(iife, {
      parser: "babel",
      semi: true,
      singleQuote: true,
      trailingComma: "all",
      printWidth: 80,
    });
  } catch {
    console.warn(
      "Warning: Prettier formatting failed. Using unformatted output.",
    );
    formatted = iife;
  }

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const outputFile = join(distDir, `${manifest.id}@${manifest.version}.js`);
  const resolvedOutput = resolve(outputFile);
  const resolvedDist = resolve(distDir);
  if (!resolvedOutput.startsWith(resolvedDist + "/")) {
    console.error("Error: Output path escapes the dist directory.");
    process.exit(1);
  }
  writeFileSync(outputFile, formatted, "utf-8");

  console.log(`\nBuild complete! Output: ${outputFile}`);
}
