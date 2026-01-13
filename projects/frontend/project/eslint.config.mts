import globals from "globals";
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// Use array form to control ordering and ensure plugin defined only once.
// Collect strict type-checked rules from typescript-eslint presets without redefining the plugin.

const allTsFiles = ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.tsx"];

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: allTsFiles,
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Enable project service for performant type-aware linting.
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    extends: [
      react.configs.flat.recommended,
      reactHooks.configs.flat["recommended-latest"],
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    files: allTsFiles,
    rules: {
      // Project-specific overrides/additions
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },
  {
    files: ["**/*.module.ts"],
    rules: {
      // Disable extraneous-class for NestJS module pattern (decorated empty classes).
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
  // Prettier last to disable conflicting stylistic rules.
  prettier,
  {
    files: allTsFiles,
    rules: {
      curly: ["error", "all"],
      "comma-spacing": ["error", { before: false, after: true }],
    },
  },
]);
