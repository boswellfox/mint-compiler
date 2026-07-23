import { readFileSync } from "fs";
import { join } from "path";
import * as jsonc from "jsonc-parser";

export function readManifest(srcDir) {
  const manifestPath = join(srcDir, "99-manifest.json");
  const content = readFileSync(manifestPath, "utf-8");
  const manifest = jsonc.parse(content);

  validateManifest(manifest);

  return manifest;
}

function validateManifest(manifest) {
  const required = [
    "class",
    "name",
    "id",
    "license",
    "authors",
    "description",
    "version",
  ];

  for (const field of required) {
    if (!manifest[field]) {
      throw new Error(`Missing required field in manifest: ${field}`);
    }
  }

  if (!Array.isArray(manifest.authors)) {
    throw new Error("Field 'authors' must be an array");
  }

  for (const author of manifest.authors) {
    if (!author.name) {
      throw new Error("Each author must have a 'name' field");
    }
  }

  if (manifest.originalAuthors && !Array.isArray(manifest.originalAuthors)) {
    throw new Error("Field 'originalAuthors' must be an array");
  }
}
