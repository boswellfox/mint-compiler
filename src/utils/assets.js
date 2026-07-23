import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const MIME_TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".txt": "text/plain",
  ".html": "text/html",
  ".css": "text/css",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function getMimeType(filePath) {
  const ext =
    filePath.lastIndexOf(".") !== -1
      ? filePath.slice(filePath.lastIndexOf("."))
      : "";
  return MIME_TYPES[ext] || "application/octet-stream";
}

export function loadAssets(projectDir) {
  const assetsDir = join(projectDir, "assets");

  if (!existsSync(assetsDir)) {
    return {};
  }

  const assets = {};
  const entries = readdirSync(assetsDir, { recursive: true });

  for (const entry of entries) {
    if (typeof entry !== "string") {
      continue;
    }
    const name = entry.split("/").pop();
    if (name.startsWith(".")) {
      continue;
    }
    const filePath = join(assetsDir, entry);
    const buffer = readFileSync(filePath);
    const base64 = buffer.toString("base64");
    const mimeType = getMimeType(filePath);
    assets[name] = `data:${mimeType};base64,${base64}`;
  }

  return assets;
}

export function generateAssetsRuntime(assets) {
  const entries = Object.entries(assets);

  if (entries.length === 0) {
    return "";
  }

  const assetEntries = entries
    .map(
      ([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`,
    )
    .join(",\n");

  return `const Mint = {
    assets: {
      _map: {
${assetEntries}
      },
      get(name) {
        return this._map[name] || null;
      },
    },
  };`;
}
