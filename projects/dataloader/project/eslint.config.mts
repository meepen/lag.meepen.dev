import globals from "globals";
import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const allTsFiles = ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.tsx"];

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: allTsFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    files: allTsFiles,
    rules: {
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
  prettier,
  {
    files: allTsFiles,
    rules: {
      curly: ["error", "all"],
      "comma-spacing": ["error", { before: false, after: true }],
    },
  },
]);
