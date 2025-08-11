// ESLint Flat Config (ESM) for ESLint v9+
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { project: ["./tsconfig.json"] }
    },
    settings: {
      // Разрешаем eslint-plugin-import понимать TypeScript и алиасы из tsconfig
      "import/resolver": {
        typescript: { project: ["./tsconfig.json"] }
      }
    },
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "unused-imports/no-unused-imports": "error",
      "import/order": ["error", { "newlines-between": "always" }]
    }
  }
);
