import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"]
  }
];
