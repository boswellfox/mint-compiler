import {
  mkdirSync,
  cpSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as jsonc from "jsonc-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tmpDir = join(__dirname, "..", ".test-tmp");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

let passed = 0;

try {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true });
  }
  mkdirSync(tmpDir, { recursive: true });

  const srcDir = join(tmpDir, "src");
  const templatesDir = join(__dirname, "..", "templates");
  cpSync(templatesDir, srcDir, { recursive: true });

  process.chdir(tmpDir);

  const { buildCommand } = await import("../src/commands/build.js");

  const manifest = jsonc.parse(
    readFileSync(join(srcDir, "99-manifest.json"), "utf-8"),
  );
  const outputFile = join(
    tmpDir,
    "dist",
    `${manifest.id}@${manifest.version}.js`,
  );

  console.log("Test 1: Build without assets...");
  await buildCommand();

  assert(existsSync(outputFile), "Output file not found");
  const output = readFileSync(outputFile, "utf-8");
  assert(output.includes("class MyExtension"), "Output missing expected class");
  assert(output.includes("hello"), "Output missing hello function");
  assert(
    !output.includes("Mint"),
    "Output should not contain Mint without assets",
  );
  console.log("  PASS");
  passed++;

  console.log("Test 2: Build with assets...");
  const assetsDir = join(tmpDir, "assets");
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(
    join(assetsDir, "favicon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>',
    "utf-8",
  );

  rmSync(join(tmpDir, "dist"), { recursive: true, force: true });
  await buildCommand();

  assert(existsSync(outputFile), "Output file not found after adding assets");
  const outputWithAssets = readFileSync(outputFile, "utf-8");
  assert(
    outputWithAssets.includes("class MyExtension"),
    "Output missing class",
  );
  assert(outputWithAssets.includes("Mint"), "Output missing Mint object");
  assert(
    outputWithAssets.includes("get(name)"),
    "Output missing assets.get method",
  );
  assert(
    outputWithAssets.includes("data:image/svg+xml;base64,"),
    "Output missing base64 data URI for SVG",
  );
  assert(
    outputWithAssets.includes("favicon.svg"),
    "Output missing asset filename",
  );
  console.log("  PASS");
  passed++;

  console.log(`\nAll ${passed} tests passed!`);
} finally {
  process.chdir(join(__dirname, ".."));
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true });
  }
}
