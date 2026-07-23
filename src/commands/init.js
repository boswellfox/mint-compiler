import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, "..", "..", "templates");

export async function initCommand() {
  const srcDir = join(process.cwd(), "src");

  if (existsSync(srcDir)) {
    console.log("src/ directory already exists. Skipping creation.");
  } else {
    mkdirSync(srcDir, { recursive: true });
    console.log("Created src/ directory.");
  }

  const templateFiles = [
    "99-manifest.json",
    "00-index.js",
    "01-hello-world.js",
  ];

  for (const file of templateFiles) {
    const destPath = join(srcDir, file);
    if (existsSync(destPath)) {
      console.log(`${file} already exists. Skipping.`);
    } else {
      const templatePath = join(TEMPLATES_DIR, file);
      const content = readFileSync(templatePath, "utf-8");
      writeFileSync(destPath, content, "utf-8");
      console.log(`Created ${file}`);
    }
  }

  console.log(
    "\nProject initialized! Run 'mint-compiler build' to compile your extension.",
  );
}
