#!/usr/bin/env node

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);

import { program } from "commander";
import { initCommand } from "../src/commands/init.js";
import { buildCommand } from "../src/commands/build.js";

program
  .name("mint-compiler")
  .description(
    "A toolchain for compiling multiple JavaScript modules into a single TurboWarp extension",
  )
  .version(packageJson.version);

program
  .command("init")
  .description("Scaffold a new extension project in the current directory")
  .action(initCommand);

program
  .command("build")
  .description("Compile the extension")
  .action(buildCommand);

program.parse();
