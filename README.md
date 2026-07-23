# Mint Compiler

A toolchain for compiling multiple JavaScript modules into a single, highly readable TurboWarp extension.

## Features

- **Modular Development**: Write your extension across multiple files
- **Tree-Shaking**: Automatically removes unused exports
- **Auto-Class Generation**: Converts module functions into a TurboWarp extension
- **Metadata Headers**: Generates documentation headers from your manifest
- **Git Integration**: Automatically includes repository URL in output
- **Prettier Formatting**: Produces clean, consistent output

## Installation

```bash
npm install mint-compiler --save-dev
```

Or use directly with npx:

```bash
npx mint-compiler init
npx mint-compiler build
```

## Usage

### Initialize a New Project

```bash
mint-compiler init
```

This creates a `src/` directory with:

- `99-manifest.json` - Extension metadata (JSONC format)
- `00-index.js` - Entry point with `getInfo()` function
- `01-hello-world.js` - Example module with exported functions

### Build Your Extension

```bash
mint-compiler build
```

Compiles your extension to `dist/<id>@<version>.js`.

## Project Structure

```
your-extension/
├── src/
│   ├── 99-manifest.json    # Extension metadata
│   ├── 00-index.js         # Entry point (imports + getInfo)
│   └── 01-*.js             # Additional modules
├── dist/                   # Compiled output
└── package.json
```

## Manifest Format

The `99-manifest.json` file supports JSONC (JSON with comments):

```jsonc
{
  // PascalCase class name for the extension
  "class": "MyExtension",

  // Display name shown in Scratch
  "name": "My Extension",

  // Unique identifier
  "id": "myextension",

  // SPDX license identifier
  "license": "MIT",

  // Current authors
  "authors": [{ "name": "Your Name", "url": "https://example.com" }],

  // Original authors (if forked)
  "originalAuthors": [],

  // Description
  "description": "What your extension does",

  // Semantic version
  "version": "1.0.0",
}
```

## Entry Point Format

Your `00-index.js` should define a `getInfo()` function and import modules:

```javascript
import { myBlock } from "./01-my-module.js";

function getInfo() {
  return {
    id: "myextension",
    name: "My Extension",
    blocks: [
      {
        opcode: "myBlock",
        blockType: Scratch.BlockType.REPORTER,
        text: "My Block",
      },
    ],
  };
}
```

## Module Format

Additional modules export functions that become class methods:

```javascript
export function myBlock() {
  return "Hello World!";
}

// This function is never imported, so it's removed
export function unusedFunction() {
  return "This won't appear in the output";
}
```

## How It Works

1. **Parse Manifest**: Reads metadata from `99-manifest.json`
2. **Extract Functions**: Identifies all functions from entry point and imports
3. **Tree-Shake**: Removes exports that are never imported
4. **Generate Class**: Wraps functions in a class with your manifest's class name
5. **Add Header**: Prepends metadata comments (name, ID, authors, license, etc.)
6. **Wrap IIFE**: Formats in TurboWarp's required IIFE format
7. **Format**: Runs Prettier for consistent output
8. **Output**: Writes to `dist/<id>@<version>.js`

## Development

### Scripts

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with auto-fix
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm test              # Build the extension
```
