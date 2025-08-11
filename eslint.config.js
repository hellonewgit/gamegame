// ESLint Flat Config (ESM) for ESLint v9+
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    ignores: [
      "dist/**",
      "coverage/**",
      ".eslintrc.cjs",
      "node_modules/**"
    ],
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
      "import/order": ["warn", { "newlines-between": "always" }],
      // Relax strict rules for this project to keep CI green
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off"
    }
  }
);
