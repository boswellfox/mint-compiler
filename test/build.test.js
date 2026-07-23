import { mkdirSync, cpSync, rmSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as jsonc from "jsonc-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tmpDir = join(__dirname, "..", ".test-tmp");

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
  await buildCommand();

  const manifest = jsonc.parse(
    readFileSync(join(srcDir, "99-manifest.json"), "utf-8"),
  );
  const outputFile = join(
    tmpDir,
    "dist",
    `${manifest.id}@${manifest.version}.js`,
  );

  if (!existsSync(outputFile)) {
    console.error(`FAIL: Output file not found at ${outputFile}`);
    process.exit(1);
  }

  const output = readFileSync(outputFile, "utf-8");
  if (!output.includes("class MyExtension")) {
    console.error("FAIL: Output does not contain expected class");
    process.exit(1);
  }
  if (!output.includes("hello")) {
    console.error("FAIL: Output does not contain hello function");
    process.exit(1);
  }

  console.log("\nAll tests passed!");
} finally {
  process.chdir(join(__dirname, ".."));
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true });
  }
}
