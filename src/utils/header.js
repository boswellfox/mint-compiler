export function generateHeader(manifest, repoUrl) {
  const lines = [];

  lines.push(`// Name: ${manifest.name}`);
  lines.push(`// ID: ${manifest.id}`);
  lines.push(`// Description: ${manifest.description}`);

  for (const author of manifest.authors) {
    if (author.url) {
      lines.push(`// By: ${author.name} <${author.url}>`);
    } else {
      lines.push(`// By: ${author.name}`);
    }
  }

  if (manifest.originalAuthors) {
    for (const author of manifest.originalAuthors) {
      if (author.url) {
        lines.push(`// Original: ${author.name} <${author.url}>`);
      } else {
        lines.push(`// Original: ${author.name}`);
      }
    }
  }

  lines.push(`// License: ${manifest.license}`);
  lines.push(`// Version: ${manifest.version}`);
  lines.push(`// Repository: ${repoUrl}`);

  return lines.join("\n");
}
