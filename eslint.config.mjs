import js from "@eslint/js";
import ts from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

export default ts.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/*.d.ts",
      "pnpm-lock.yaml",
    ],
  },
  // Base JS rules
  js.configs.recommended,
  // Base TS rules
  ...ts.configs.recommended,
  // Specific settings/rules for Next.js web application
  {
    files: ["apps/web/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      ...nextVitals.plugins,
      ...nextTs.plugins,
    },
    rules: {
      ...nextVitals.rules,
      ...nextTs.rules,
    },
  },
  // Custom rules for general TypeScript files (packages & backend)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  // Prettier config (must be last)
  eslintConfigPrettier,
);
