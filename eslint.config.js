import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-throw-literal": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "templates/"],
  },
];
