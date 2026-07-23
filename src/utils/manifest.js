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

  if (
    typeof manifest.id !== "string" ||
    !/^[a-zA-Z0-9._-]+$/.test(manifest.id)
  ) {
    throw new Error(
      "Field 'id' must be a valid filename segment (no path separators or traversal)",
    );
  }

  if (
    typeof manifest.version !== "string" ||
    !/^[a-zA-Z0-9._+-]+$/.test(manifest.version)
  ) {
    throw new Error(
      "Field 'version' must be a valid filename segment (no path separators or traversal)",
    );
  }

  if (!Array.isArray(manifest.authors)) {
    throw new Error("Field 'authors' must be an array");
  }

  for (const author of manifest.authors) {
    if (!author || typeof author !== "object") {
      throw new Error("Each author must be a non-null object");
    }
    if (typeof author.name !== "string" || !author.name) {
      throw new Error("Each author must have a non-empty 'name' field");
    }
  }

  if (manifest.originalAuthors && !Array.isArray(manifest.originalAuthors)) {
    throw new Error("Field 'originalAuthors' must be an array");
  }

  if (Array.isArray(manifest.originalAuthors)) {
    for (const author of manifest.originalAuthors) {
      if (!author || typeof author !== "object") {
        throw new Error("Each original author must be a non-null object");
      }
      if (typeof author.name !== "string" || !author.name) {
        throw new Error(
          "Each original author must have a non-empty 'name' field",
        );
      }
    }
  }
}
