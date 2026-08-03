import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });

const config = [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    }
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "public/vendor/**", "next-env.d.ts", "scripts/prepare-candidate-logos.ts"]
  }
];

export default config;
