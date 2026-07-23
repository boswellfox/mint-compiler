import { program } from "commander";
import { initCommand } from "./commands/init.js";
import { buildCommand } from "./commands/build.js";

export function setupCLI(version) {
  program
    .name("mint-compiler")
    .description(
      "A toolchain for compiling multiple JavaScript modules into a single TurboWarp extension",
    )
    .version(version);

  program
    .command("init")
    .description("Scaffold a new extension project in the current directory")
    .action(initCommand);

  program
    .command("build")
    .description("Compile the extension")
    .action(buildCommand);

  return program;
}
